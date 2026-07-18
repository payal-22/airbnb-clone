import math
from datetime import date
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

@app.post(
    "/bookings",
    response_model=schemas.BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    booking_data: schemas.BookingCreate,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(models.Listing)
        .filter(
            models.Listing.id == booking_data.listing_id,
            models.Listing.is_active.is_(True),
        )
        .first()
    )

    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )

    guest = (
        db.query(models.User)
        .filter(models.User.id == booking_data.guest_id)
        .first()
    )

    if guest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found",
        )

    if guest.role != "guest":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user is not a guest",
        )

    if booking_data.check_in < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-in date cannot be in the past",
        )

    if booking_data.check_out <= booking_data.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out date must be after check-in date",
        )

    if booking_data.guests > listing.max_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"This listing allows a maximum of "
                f"{listing.max_guests} guests"
            ),
        )

    overlapping_booking = (
        db.query(models.Booking)
        .filter(
            models.Booking.listing_id == booking_data.listing_id,
            models.Booking.status == "confirmed",
            models.Booking.check_in < booking_data.check_out,
            models.Booking.check_out > booking_data.check_in,
        )
        .first()
    )

    if overlapping_booking is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The listing is unavailable for the selected dates",
        )

    nights = (booking_data.check_out - booking_data.check_in).days
    nightly_total = listing.price_per_night * nights

    total_price = (
        nightly_total
        + listing.cleaning_fee
        + listing.service_fee
    )

    booking = models.Booking(
        listing_id=booking_data.listing_id,
        guest_id=booking_data.guest_id,
        check_in=booking_data.check_in,
        check_out=booking_data.check_out,
        guests=booking_data.guests,
        nights=nights,
        nightly_total=nightly_total,
        cleaning_fee=listing.cleaning_fee,
        service_fee=listing.service_fee,
        total_price=total_price,
        status="confirmed",
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


@app.get(
    "/listings/{listing_id}/unavailable-dates",
)
def get_unavailable_dates(
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

    bookings = (
        db.query(models.Booking)
        .filter(
            models.Booking.listing_id == listing_id,
            models.Booking.status == "confirmed",
        )
        .order_by(models.Booking.check_in.asc())
        .all()
    )

    return [
        {
            "booking_id": booking.id,
            "check_in": booking.check_in,
            "check_out": booking.check_out,
        }
        for booking in bookings
    ]


@app.get(
    "/users/{user_id}/trips",
    response_model=list[schemas.BookingResponse],
)
def get_user_trips(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    bookings = (
        db.query(models.Booking)
        .filter(models.Booking.guest_id == user_id)
        .order_by(models.Booking.check_in.asc())
        .all()
    )

    return bookings


@app.get(
    "/hosts/{host_id}/bookings",
    response_model=list[schemas.BookingResponse],
)
def get_host_bookings(
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

    bookings = (
        db.query(models.Booking)
        .join(
            models.Listing,
            models.Booking.listing_id == models.Listing.id,
        )
        .filter(models.Listing.host_id == host_id)
        .order_by(models.Booking.check_in.asc())
        .all()
    )

    return bookings