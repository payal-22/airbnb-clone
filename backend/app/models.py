from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(20), nullable=False, default="guest")
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    listings = relationship(
        "Listing",
        back_populates="host",
        cascade="all, delete-orphan",
    )

    bookings = relationship(
        "Booking",
        back_populates="guest",
        cascade="all, delete-orphan",
    )


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(200), nullable=False)
    country = Column(String(100), nullable=False, default="India")
    property_type = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False, default="Trending")

    price_per_night = Column(Float, nullable=False)
    cleaning_fee = Column(Float, nullable=False, default=500)
    service_fee = Column(Float, nullable=False, default=300)

    max_guests = Column(Integer, nullable=False, default=2)
    bedrooms = Column(Integer, nullable=False, default=1)
    beds = Column(Integer, nullable=False, default=1)
    bathrooms = Column(Float, nullable=False, default=1)

    rating = Column(Float, nullable=False, default=4.5)
    review_count = Column(Integer, nullable=False, default=0)

    image_url = Column(String(500), nullable=False)
    image_urls = Column(Text, nullable=True)
    amenities = Column(Text, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    host = relationship("User", back_populates="listings")

    bookings = relationship(
        "Booking",
        back_populates="listing",
        cascade="all, delete-orphan",
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer,
        ForeignKey("listings.id"),
        nullable=False,
    )
    guest_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests = Column(Integer, nullable=False)

    nights = Column(Integer, nullable=False)
    nightly_total = Column(Float, nullable=False)
    cleaning_fee = Column(Float, nullable=False)
    service_fee = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    status = Column(String(30), nullable=False, default="confirmed")
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("Listing", back_populates="bookings")
    guest = relationship("User", back_populates="bookings")
