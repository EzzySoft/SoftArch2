from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from .api.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


main_app = FastAPI(
    title="Chat API",
    description="N/A",
    version="0.1.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    lifespan=lifespan,
)

main_app.include_router(chat_router, prefix="/messages")

if __name__ == "__main__":
    uvicorn.run("main:main_app", host="localhost", port=8000, reload=True)
