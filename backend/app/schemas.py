from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ListingBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    location: str
    country: str = "India"
    property_type: str
    category: str = "Trending"

    price_per_night: float = Field(gt=0)
    cleaning_fee: float = Field(default=500, ge=0)
    service_fee: float = Field(default=300, ge=0)

    max_guests: int = Field(default=2, gt=0)
    bedrooms: int = Field(default=1, ge=0)
    beds: int = Field(default=1, gt=0)
    bathrooms: float = Field(default=1, gt=0)

    image_url: str
    image_urls: Optional[str] = None
    amenities: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ListingCreate(ListingBase):
    host_id: int


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    property_type: Optional[str] = None
    category: Optional[str] = None

    price_per_night: Optional[float] = Field(default=None, gt=0)
    cleaning_fee: Optional[float] = Field(default=None, ge=0)
    service_fee: Optional[float] = Field(default=None, ge=0)

    max_guests: Optional[int] = Field(default=None, gt=0)
    bedrooms: Optional[int] = Field(default=None, ge=0)
    beds: Optional[int] = Field(default=None, gt=0)
    bathrooms: Optional[float] = Field(default=None, gt=0)

    image_url: Optional[str] = None
    image_urls: Optional[str] = None
    amenities: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None


class ListingResponse(ListingBase):
    id: int
    host_id: int
    rating: float
    review_count: int
    is_active: bool
    created_at: datetime
    host: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class BookingCreate(BaseModel):
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int = Field(gt=0)


class BookingResponse(BaseModel):
    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int
    nights: int
    nightly_total: float
    cleaning_fee: float
    service_fee: float
    total_price: float
    status: str
    created_at: datetime
    listing: Optional[ListingResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedListings(BaseModel):
    items: List[ListingResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
