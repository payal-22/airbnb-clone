from datetime import date, timedelta

from app.database import Base, SessionLocal, engine
from app.models import Booking, Listing, User


def seed_database() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        if db.query(User).count() > 0:
            print("Seed data already exists.")
            return

        guest = User(
            name="Yash Raj",
            email="guest@example.com",
            role="guest",
            avatar_url="https://i.pravatar.cc/150?img=12",
        )

        host_one = User(
            name="Aarav Sharma",
            email="aarav@example.com",
            role="host",
            avatar_url="https://i.pravatar.cc/150?img=11",
        )

        host_two = User(
            name="Meera Kapoor",
            email="meera@example.com",
            role="host",
            avatar_url="https://i.pravatar.cc/150?img=47",
        )

        db.add_all([guest, host_one, host_two])
        db.commit()

        db.refresh(guest)
        db.refresh(host_one)
        db.refresh(host_two)

        listings = [
            Listing(
                host_id=host_one.id,
                title="Luxury Villa with Private Pool",
                description=(
                    "A spacious luxury villa with a private pool, modern "
                    "interiors, peaceful surroundings, and premium amenities."
                ),
                location="Lonavala, Maharashtra",
                country="India",
                property_type="Villa",
                category="Amazing pools",
                price_per_night=8500,
                cleaning_fee=900,
                service_fee=600,
                max_guests=8,
                bedrooms=4,
                beds=5,
                bathrooms=4,
                rating=4.92,
                review_count=128,
                image_url=(
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                image_urls=(
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                    "?auto=format&fit=crop&w=1200&q=80,"
                    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                amenities="Pool,WiFi,Kitchen,Parking,Air conditioning,TV",
                latitude=18.7546,
                longitude=73.4062,
            ),
            Listing(
                host_id=host_two.id,
                title="Beachfront Cottage in Goa",
                description=(
                    "Wake up to beautiful ocean views in a comfortable "
                    "beachfront cottage located only a few steps from the sea."
                ),
                location="Goa",
                country="India",
                property_type="Cottage",
                category="Beachfront",
                price_per_night=6200,
                cleaning_fee=700,
                service_fee=450,
                max_guests=4,
                bedrooms=2,
                beds=2,
                bathrooms=2,
                rating=4.88,
                review_count=94,
                image_url=(
                    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                image_urls=(
                    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2"
                    "?auto=format&fit=crop&w=1200&q=80,"
                    "https://images.unsplash.com/photo-1505691938895-1758d7feb511"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                amenities="Beach access,WiFi,Kitchen,Air conditioning,TV",
                latitude=15.2993,
                longitude=74.1240,
            ),
            Listing(
                host_id=host_one.id,
                title="Modern Apartment in Bengaluru",
                description=(
                    "A stylish apartment close to restaurants, technology "
                    "parks, shopping centres, and popular city attractions."
                ),
                location="Bengaluru, Karnataka",
                country="India",
                property_type="Apartment",
                category="City",
                price_per_night=4200,
                cleaning_fee=500,
                service_fee=350,
                max_guests=3,
                bedrooms=1,
                beds=2,
                bathrooms=1,
                rating=4.79,
                review_count=76,
                image_url=(
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                image_urls=(
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
                    "?auto=format&fit=crop&w=1200&q=80,"
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                amenities="WiFi,Kitchen,Workspace,Air conditioning,Elevator",
                latitude=12.9716,
                longitude=77.5946,
            ),
            Listing(
                host_id=host_two.id,
                title="Peaceful Mountain Cabin",
                description=(
                    "Enjoy mountain views, fresh air, warm wooden interiors, "
                    "and a peaceful stay inside this charming cabin."
                ),
                location="Manali, Himachal Pradesh",
                country="India",
                property_type="Cabin",
                category="Cabins",
                price_per_night=5100,
                cleaning_fee=600,
                service_fee=400,
                max_guests=5,
                bedrooms=2,
                beds=3,
                bathrooms=2,
                rating=4.95,
                review_count=143,
                image_url=(
                    "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                image_urls=(
                    "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8"
                    "?auto=format&fit=crop&w=1200&q=80,"
                    "https://images.unsplash.com/photo-1520984032042-162d526883e0"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                amenities="Mountain view,WiFi,Kitchen,Heating,Parking,Fireplace",
                latitude=32.2432,
                longitude=77.1892,
            ),
        ]

        db.add_all(listings)
        db.commit()

        for listing in listings:
            db.refresh(listing)

        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=3)

        booking = Booking(
            listing_id=listings[0].id,
            guest_id=guest.id,
            check_in=check_in,
            check_out=check_out,
            guests=2,
            nights=3,
            nightly_total=listings[0].price_per_night * 3,
            cleaning_fee=listings[0].cleaning_fee,
            service_fee=listings[0].service_fee,
            total_price=(
                listings[0].price_per_night * 3
                + listings[0].cleaning_fee
                + listings[0].service_fee
            ),
            status="confirmed",
        )

        db.add(booking)
        db.commit()

        print("Database seeded successfully.")
        print(f"Guest ID: {guest.id}")
        print(f"Host IDs: {host_one.id}, {host_two.id}")
        print(f"Listings created: {len(listings)}")
        print("Bookings created: 1")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()