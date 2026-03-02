from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.esquemas.usuario import UsuarioCreate, UsuarioOut, UsuarioUpdate, PasswordChange, PerfilUpdate
from app.auth.auth import get_password_hash, verify_password, get_current_user
from app.auth.deps import require_admin, require_profesor_or_admin

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/", response_model=UsuarioOut)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Solo admin puede crear usuarios."""
    if not usuario.usuario or not usuario.usuario.strip():
        raise HTTPException(status_code=400, detail="El alias es obligatorio")
    if usuario.rol not in ("admin", "profesor", "alumno"):
        raise HTTPException(status_code=400, detail="Rol inválido. Opciones: admin, profesor, alumno")

    db_usuario = db.query(Usuario).filter(Usuario.usuario == usuario.usuario).first()
    if db_usuario:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese alias")

    nuevo_usuario = Usuario(
        usuario=usuario.usuario,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        password_hash=get_password_hash(usuario.password),
        rol=usuario.rol,
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.get("/", response_model=List[UsuarioOut])
def listar_usuarios(
    rol: Optional[str] = Query(None, description="Filtrar por rol: admin, profesor, alumno"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo"),
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Profesor y admin pueden listar usuarios. Soporta filtros por rol y estado."""
    query = db.query(Usuario)
    if rol:
        query = query.filter(Usuario.rol == rol)
    if activo is not None:
        query = query.filter(Usuario.activo == activo)
    return query.order_by(Usuario.apellido, Usuario.nombre).offset(skip).limit(limit).all()


@router.get("/me", response_model=UsuarioOut)
def obtener_mi_perfil(current_user: Usuario = Depends(get_current_user)):
    """Cualquier usuario autenticado puede ver su propio perfil."""
    return current_user


@router.patch("/me/password")
def cambiar_password(
    datos: PasswordChange,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cualquier usuario autenticado puede cambiar su propia contraseña."""
    if not verify_password(datos.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    if len(datos.new_password) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    current_user.password_hash = get_password_hash(datos.new_password)
    db.commit()
    return {"detail": "Contraseña actualizada correctamente"}


@router.patch("/me", response_model=UsuarioOut)
def actualizar_mi_perfil(
    datos: PerfilUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cualquier usuario autenticado puede actualizar su email y preferencias."""
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Solo admin puede actualizar usuarios."""
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = usuario_update.model_dump(exclude_unset=True)

    if "rol" in update_data and update_data["rol"] not in ("admin", "profesor", "alumno"):
        raise HTTPException(status_code=400, detail="Rol inválido. Opciones: admin, profesor, alumno")

    for key, value in update_data.items():
        setattr(db_usuario, key, value)

    db.commit()
    db.refresh(db_usuario)
    return db_usuario


@router.patch("/{usuario_id}/activar", response_model=UsuarioOut)
def activar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Admin activa un usuario desactivado."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.activo = True
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/{usuario_id}/desactivar", response_model=UsuarioOut)
def desactivar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Admin desactiva un usuario. No se puede desactivar a sí mismo."""
    if usuario_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.activo = False
    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}")
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Solo admin puede eliminar usuarios. No se puede eliminar a sí mismo."""
    if usuario_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"detail": "Usuario eliminado"}
