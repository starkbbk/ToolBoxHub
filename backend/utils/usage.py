from fastapi import Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta

from database import get_database
from utils.auth import get_current_user_email
from models.user import PlanType, SubscriptionStatus

# Daily limits for free users
FREE_LIMITS = {
    "pdf_conversions": 5,
    "text_removals": 3,
    "image_compressions": 5
}

async def check_usage_limit(tool_key: str, email: str = Depends(get_current_user_email), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    plan = user.get("subscription_plan", PlanType.FREE)
    status = user.get("subscription_status", SubscriptionStatus.NONE)
    
    # Pro and Enterprise have unlimited access
    if plan in [PlanType.PRO, PlanType.ENTERPRISE] and status == SubscriptionStatus.ACTIVE:
        return True
    
    # Check if a new day has started to reset usage
    usage = user.get("usage", {})
    last_reset = usage.get("last_reset")
    now = datetime.utcnow()
    
    if not last_reset or last_reset.date() < now.date():
        # Reset usage
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "usage.pdf_conversions": 0,
                "usage.text_removals": 0,
                "usage.image_compressions": 0,
                "usage.last_reset": now
            }}
        )
        usage = {"pdf_conversions": 0, "text_removals": 0, "image_compressions": 0}
    
    current_usage = usage.get(tool_key, 0)
    limit = FREE_LIMITS.get(tool_key, 0)
    
    if current_usage >= limit:
        raise HTTPException(
            status_code=403, 
            detail=f"Daily limit reached for {tool_key.replace('_', ' ')}. Upgrade to Pro for unlimited access."
        )
    
    # Increment usage
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$inc": {f"usage.{tool_key}": 1}}
    )
    
    return True
