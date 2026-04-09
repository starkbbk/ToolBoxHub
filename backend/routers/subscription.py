from fastapi import APIRouter, Depends, HTTPException, Request, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
import stripe
from datetime import datetime
from bson import ObjectId
import logging

from database import get_database
from config import settings
from utils.auth import get_current_user_email
from shared.response import success_response
from models.user import PlanType, SubscriptionStatus

router = APIRouter()
stripe.api_key = settings.stripe_secret_key

# Define plan IDs from settings
STRIPE_PLAN_IDS = {
    "pro_monthly": settings.stripe_pro_monthly_id,
    "enterprise_monthly": settings.stripe_ent_monthly_id,
    "business_monthly": settings.stripe_bus_monthly_id,
    "claudemax_monthly": settings.stripe_cla_monthly_id,
    "pro_yearly": settings.stripe_pro_yearly_id,
    "enterprise_yearly": settings.stripe_ent_yearly_id,
    "business_yearly": settings.stripe_bus_yearly_id,
    "claudemax_yearly": settings.stripe_cla_yearly_id,
}

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    return await db.users.find_one({"email": email})

@router.post("/create-checkout-session")
async def create_checkout_session(
    plan: str = Body(...),
    cycle: str = Body(...), # monthly or yearly
    email: str = Depends(get_current_user_email),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Normalize: "Claude Max Plan" -> "claudemax", "Pro" -> "pro"
    normalized_plan = plan.lower().replace(" ", "").replace("plan", "")
    plan_key = f"{normalized_plan}_{cycle.lower()}"
    price_id = STRIPE_PLAN_IDS.get(plan_key)
    
    if not price_id:
        logging.error(f"PRICE ID NOT FOUND: Requested plan_key='{plan_key}' (From plan='{plan}', cycle='{cycle}')")
        raise HTTPException(status_code=400, detail=f"Invalid plan or cycle: {plan_key}")
    
    try:
        checkout_session = stripe.checkout.Session.create(
            customer_email=email,
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=f"{settings.frontend_url}/profile?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.frontend_url}/pricing",
            metadata={
                "user_id": str(user["_id"]),
                "plan": plan.lower()
            }
        )
        return success_response({"url": checkout_session.url})
    except Exception as e:
        logging.error(f"STRIPE ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']
        plan = session['metadata']['plan']
        stripe_customer_id = session['customer']
        stripe_subscription_id = session['subscription']
        
def normalize_plan_name(plan: str) -> str:
    """Normalize Stripe metadata plan string to internal PlanType enum value."""
    p = plan.lower()
    if "max" in p or "claude" in p:
        return "claude max plan"
    if "business" in p:
        return "business"
    if "enterprise" in p:
        return "enterprise"
    if "pro" in p:
        return "pro"
    return "free"

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        logging.error("WEBHOOK ERROR: Invalid payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        logging.error("WEBHOOK ERROR: Invalid signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata'].get('user_id')
        plan_meta = session['metadata'].get('plan', 'pro')
        stripe_customer_id = session.get('customer')
        stripe_subscription_id = session.get('subscription')
        
        if not user_id:
            logging.error("WEBHOOK ERROR: No user_id in session metadata")
            return {"status": "error", "message": "No user_id"}
            
        db_plan = normalize_plan_name(plan_meta)
        
        logging.info(f"WEBHOOK: Updating User {user_id} to Plan {db_plan} (Raw: {plan_meta})")
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "subscription_plan": db_plan,
                "subscription_status": SubscriptionStatus.ACTIVE,
                "stripe_customer_id": stripe_customer_id,
                "stripe_subscription_id": stripe_subscription_id,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            logging.error(f"WEBHOOK: No user found or updated for ID {user_id}")
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        await db.users.update_one(
            {"stripe_subscription_id": subscription['id']},
            {"$set": {
                "subscription_plan": PlanType.FREE,
                "subscription_status": SubscriptionStatus.CANCELLED,
                "updated_at": datetime.utcnow()
            }}
        )
        
    return {"status": "success"}
    
@router.get("/verify-session/{session_id}")
async def verify_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Directly verify a Stripe session ID and update the user if paid.
    Acts as an immediate fallback for the webhook.
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status != 'paid':
            return success_response({"status": session.payment_status, "updated": False})
            
        user_id = session['metadata'].get('user_id')
        plan_meta = session['metadata'].get('plan', 'pro')
        stripe_customer_id = session.get('customer')
        stripe_subscription_id = session.get('subscription')
        
        if not user_id:
            logging.error("VERIFY-SESSION: No user_id in session metadata")
            return success_response({"status": "error", "message": "No user_id"})
            
        db_plan = normalize_plan_name(plan_meta)
        
        logging.info(f"VERIFY-SESSION: Manually updating User {user_id} to Plan {db_plan} (Raw: {plan_meta})")
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "subscription_plan": db_plan,
                "subscription_status": SubscriptionStatus.ACTIVE,
                "stripe_customer_id": stripe_customer_id,
                "stripe_subscription_id": stripe_subscription_id,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return success_response({"status": "paid", "updated": True, "plan": db_plan})
        
    except Exception as e:
        logging.error(f"VERIFICATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_subscription_status(email: str = Depends(get_current_user_email), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return success_response({
        "plan": user.get("subscription_plan", PlanType.FREE),
        "status": user.get("subscription_status", SubscriptionStatus.NONE),
        "usage": user.get("usage", {})
    })
