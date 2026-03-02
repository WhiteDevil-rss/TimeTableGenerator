import sys
import json
import math
from app.models import GenerateRequest
from app.solver import TimetableScheduler

def main():
    with open('../api/payload.json') as f:
        data = json.load(f)
    req = GenerateRequest(**data)
    
    cfg = req.config
    for c in req.courses:
        c.weeklyHrs = math.ceil((c.weeklyHrs * 60) / cfg.lectureDuration)
        if hasattr(c, 'labDuration') and c.labDuration > 0:
            c.labDuration = math.ceil((c.labDuration * 60) / cfg.lectureDuration)
    for basket in req.electiveBaskets:
        basket.weeklyHrs = math.ceil((basket.weeklyHrs * 60) / cfg.lectureDuration)

    scheduler = TimetableScheduler(req)
    # Start commenting out constraints locally if needed.
    # For now, let's just see if it is INFEASIBLE locally before we edit solver.py
    
    # Debug logic
    days_count = scheduler.request.config.daysPerWeek
    slots_per_day = len(scheduler.lecture_slots)
    total_slots = days_count * slots_per_day
    print(f"Total available slots per week: {total_slots}")
    for c in scheduler.request.courses:
        print(f"  Course {c.name} requires {c.weeklyHrs} slots.")
        if c.weeklyHrs > total_slots:
            print("  >>> MATHEMATICALLY IMPOSSIBLE <<<")
            
    for bk in scheduler.request.electiveBaskets:
        print(f"  Basket {bk.name} requires {bk.weeklyHrs} slots.")
        if bk.weeklyHrs > total_slots:
            print("  >>> MATHEMATICALLY IMPOSSIBLE <<<")
            
    print("--- BATCH SUM CHECK ---")
    for b in scheduler.request.batches:
        batch_courses = [c for c in scheduler.request.courses if (not c.program or c.program == b.program) and (not c.semester or c.semester == b.semester)]
        b_sum = sum(c.weeklyHrs for c in batch_courses)
        basket_sum = sum(bk.weeklyHrs for bk in scheduler.request.electiveBaskets if bk.program == b.program and bk.semester == b.semester)
        print(f"  Batch {b.name} total slots needed: {b_sum + basket_sum}")
        if (b_sum + basket_sum) > total_slots:
            print("  >>> MATHEMATICALLY IMPOSSIBLE TO FIT ALL COURSES IN THE BATCH! <<<")
            
    result = scheduler.solve()
    print("STATUS:", result.status)
    print("MESSAGE:", result.message)

if __name__ == '__main__':
    main()
