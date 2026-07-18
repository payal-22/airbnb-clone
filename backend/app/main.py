import math
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Airbnb Clone API",
    description="Backend API for the Airbnb clone assignment",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Airbnb Clone API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get(
    "/listings",
    response_model=schemas.PaginatedListings,
)
def get_listings(
    search: Optional[str] = None,
    category: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    guests: Optional[int] = Query(default=None, ge=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(models.Listing).filter(
        models.Listing.is_active.is_(True)
    )

    if search:
        search_term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                models.Listing.title.ilike(search_term),
                models.Listing.location.ilike(search_term),
                models.Listing.country.ilike(search_term),
            )
        )

    if category:
        query = query.filter(
            models.Listing.category.ilike(category.strip())
        )

    if property_type:
        query = query.filter(
            models.Listing.property_type.ilike(property_type.strip())
        )

    if min_price is not None:
        query = query.filter(
            models.Listing.price_per_night >= min_price
        )

    if max_price is not None:
        query = query.filter(
            models.Listing.price_per_night <= max_price
        )

    if guests is not None:
        query = query.filter(
            models.Listing.max_guests >= guests
        )

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    listings = (
        query.order_by(models.Listing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": listings,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


@app.get(
    "/listings/{listing_id}",
    response_model=schemas.ListingResponse,
)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(models.Listing)
        .filter(
            models.Listing.id == listing_id,
            models.Listing.is_active.is_(True),
        )
        .first()
    )

    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    return listing


@app.post(
    "/listings",
    response_model=schemas.ListingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_listing(
    listing_data: schemas.ListingCreate,
    db: Session = Depends(get_db),
):
    host = (
        db.query(models.User)
        .filter(models.User.id == listing_data.host_id)
        .first()
    )

    if host is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found",
        )

    if host.role != "host":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a host",
        )

    listing = models.Listing(**listing_data.model_dump())

    db.add(listing)
    db.commit()
    db.refresh(listing)

    return listing


@app.put(
    "/listings/{listing_id}",
    response_model=schemas.ListingResponse,
)
def update_listing(
    listing_id: int,
    listing_data: schemas.ListingUpdate,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(models.Listing)
        .filter(models.Listing.id == listing_id)
        .first()
    )

    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    update_values = listing_data.model_dump(exclude_unset=True)

    for field, value in update_values.items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)

    return listing


@app.delete("/listings/{listing_id}")
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(models.Listing)
        .filter(models.Listing.id == listing_id)
        .first()
    )

    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    listing.is_active = False

    db.commit()

    return {
        "message": "Listing deleted successfully",
        "listing_id": listing_id,
    }


@app.get(
    "/hosts/{host_id}/listings",
    response_model=list[schemas.ListingResponse],
)
def get_host_listings(
    host_id: int,
    db: Session = Depends(get_db),
):
    host = (
        db.query(models.User)
        .filter(models.User.id == host_id)
        .first()
    )

    if host is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found",
        )

    if host.role != "host":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a host",
        )

    return (
        db.query(models.Listing)
        .filter(models.Listing.host_id == host_id)
        .order_by(models.Listing.created_at.desc())
        .all()
    )