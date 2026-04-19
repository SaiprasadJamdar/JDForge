import bcrypt
from sqlalchemy.orm import Session

from backend.modules.auth.model import User

def hash_password(password: str) -> str:
    # bcrypt requires bytes and returns bytes
    hashed = bcrypt.hashpw(password[:72].encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain[:72].encode('utf-8'), hashed.encode('utf-8'))
    except ValueError:
        return False


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, name: str, email: str, password: str) -> User:
    user = User(name=name, email=email, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def update_user_password(db: Session, user: User, new_password: str) -> None:
    user.password_hash = hash_password(new_password)
    db.commit()
