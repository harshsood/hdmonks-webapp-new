#!/usr/bin/env python3
"""
Migration script to fix services with missing or invalid relevant_for fields
Run this after deployment to ensure all services are properly formatted
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path so we can import database
sys.path.insert(0, str(Path(__file__).parent))

from database import database
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def fix_services_relevant_for():
    """Fix all services with missing or invalid relevant_for fields"""
    
    try:
        # Connect to database
        await database.connect()
        logger.info("Connected to MongoDB")
        
        # Get all stages
        stages = await database.get_all_stages()
        logger.info(f"Found {len(stages)} stages")
        
        fixed_count = 0
        
        for stage in stages:
            if not stage.get('services'):
                continue
            
            services_to_update = []
            
            for service in stage['services']:
                # Check if service needs fixing
                if not isinstance(service.get('relevant_for'), list) or not service.get('relevant_for'):
                    logger.warning(
                        f"Stage {stage['id']}: Service {service.get('service_id')} has invalid relevant_for: {service.get('relevant_for')}"
                    )
                    services_to_update.append(service['service_id'])
                    fixed_count += 1
            
            # Update services
            for service_id in services_to_update:
                logger.info(f"Fixing service {service_id} in stage {stage['id']}")
                
                update_data = {
                    'relevant_for': ['startup', 'msme'],
                    'updated_at': __import__('datetime').datetime.utcnow().isoformat()
                }
                
                result = await database.db.stages.update_one(
                    {"id": stage['id'], "services.service_id": service_id},
                    {"$set": {"services.$.relevant_for": update_data['relevant_for'],
                              "services.$.updated_at": update_data['updated_at']}}
                )
                
                if result.modified_count > 0:
                    logger.info(f"✓ Fixed service {service_id}")
                else:
                    logger.warning(f"✗ Failed to fix service {service_id}")
        
        logger.info(f"Migration complete! Fixed {fixed_count} services")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        raise
    
    finally:
        await database.close()
        logger.info("Disconnected from MongoDB")


if __name__ == "__main__":
    asyncio.run(fix_services_relevant_for())
