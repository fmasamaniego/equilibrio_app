from fastapi import Depends, HTTPException, status
from app.auth.auth import get_current_user
from app.modelos.usuarios import Usuario


def require_role(*roles: str):
    """Dependency factory that restricts access to users with specific roles.

    Usage:
        @router.get("/", dependencies=[Depends(require_role("admin", "profesor"))])
        or as a parameter:
        current_user: Usuario = Depends(require_role("admin"))
    """
    def role_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere rol: {', '.join(roles)}",
            )
        return current_user
    return role_checker


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador",
        )
    return current_user


def require_profesor_or_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol not in ("admin", "profesor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de profesor o administrador",
        )
    return current_user
