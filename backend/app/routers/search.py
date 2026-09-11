from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import List, Dict, Any
from enum import Enum

from app.database import get_session
from app.auth import get_current_user
from app.models import AdminQuery, User, UserRole, Workspace, Task

router = APIRouter(
    prefix="/search",
    tags=["Search"],
)


def _readable(value) -> str:
    """Render SQLModel enums as their plain string value for display."""
    return value.value if isinstance(value, Enum) else str(value)

@router.get("", response_model=Dict[str, List[Any]])
@router.get("/", response_model=Dict[str, List[Any]])
async def global_search(
    q: str = Query(..., min_length=1),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query_str = f"%{q.lower()}%"
    limit = 6
    org_id = current_user.organization_id

    # 1. Employees
    employees = session.exec(
        select(User)
        .where(User.organization_id == org_id)
        .where(User.is_active == True)
        .where(User.name.ilike(query_str) | User.email.ilike(query_str))
        .limit(limit)
    ).all()
    employee_results = [
        {
            "id": e.id, 
            "title": e.name, 
            "subtitle": e.email, 
            "icon": e.profile_picture, 
            "type": "Employee"
        } 
        for e in employees
    ]

    # 2. Projects (Workspaces)
    workspaces = session.exec(
        select(Workspace)
        .where(Workspace.organization_id == org_id)
        .where(Workspace.name.ilike(query_str))
        .limit(limit)
    ).all()
    project_results = [
        {
            "id": w.id, 
            "title": w.name, 
            "subtitle": w.description or "Workspace", 
            "icon": w.icon, 
            "type": "Project"
        } 
        for w in workspaces
    ]

    # 3. Tasks
    tasks = session.exec(
        select(Task)
        .where(Task.organization_id == org_id)
        .where(Task.title.ilike(query_str))
        .limit(limit)
    ).all()
    task_results = [
        {
            "id": t.id, 
            "title": t.title, 
            "subtitle": f"Status: {_readable(t.status)}", 
            "icon": None, 
            "type": "Task"
        } 
        for t in tasks
    ]

    # 4. Tickets (AdminQueries) — scoped by role
    ticket_stmt = select(AdminQuery).where(
        AdminQuery.organization_id == org_id,
        AdminQuery.title.ilike(query_str) | AdminQuery.description.ilike(query_str),
    )
    if current_user.role not in (UserRole.admin, UserRole.manager):
        ticket_stmt = ticket_stmt.where(
            (AdminQuery.raised_by == current_user.id)
            | (AdminQuery.assigned_to == current_user.id)
        )
    tickets = session.exec(ticket_stmt.limit(limit)).all()
    ticket_results = [
        {
            "id": t.id, 
            "title": t.title, 
            "subtitle": f"Priority: {_readable(t.priority)} · Status: {_readable(t.status)}", 
            "icon": None, 
            "type": "Ticket"
        } 
        for t in tickets
    ]

    return {
        "employees": employee_results,
        "projects": project_results,
        "tasks": task_results,
        "tickets": ticket_results
    }
