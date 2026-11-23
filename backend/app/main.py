from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.models.database import Base, engine, SessionLocal
from app.models.models import User
from app.seed.seed_data import seed_database

from app.api.auth import router as auth_router
from app.api.ventures import router as ventures_router
from app.api.investors import router as investors_router
from app.api.connections import router as connections_router
from app.api.messages import router as messages_router
from app.api.ai_chat import router as ai_router
from app.api.onboarding import router as onboarding_router
from app.api.matches import router as matches_router
from app.api.appointments import router as appointments_router
from app.api.platform_config import router as config_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Nivesha Ventures Platform API",
    description="Independently verified venture discovery, founder showcases, investor cards, AI diligence assistant, and direct messaging.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(ventures_router, prefix="/api")
app.include_router(investors_router, prefix="/api")
app.include_router(connections_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(onboarding_router, prefix="/api")
app.include_router(matches_router, prefix="/api")
app.include_router(appointments_router, prefix="/api")
app.include_router(config_router, prefix="/api")


@app.post("/api/dev/reset")
def reset_database():
    db = SessionLocal()
    try:
        seed_database(db)
        return {"status": "SUCCESS", "message": "Nivesha platform database reset and re-seeded."}
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "platform": "Nivesha Ventures",
        "tagline": "Indian ventures, independently verified and clearly told.",
        "status": "ONLINE",
        "docs": "/docs",
    }
