"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import type { Listing } from "@/types/listing";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

interface UnavailableDate {
  booking_id: number;
  check_in: string;
  check_out: string;
}

interface BookingResponse {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  total_price: number;
  status: string;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const difference = end.getTime() - start.getTime();

  return Math.max(
    0,
    Math.round(difference / (1000 * 60 * 60 * 24)),
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = Number(params.id);

  const [listing, setListing] = useState<Listing | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<
    UnavailableDate[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");

  useEffect(() => {
    async function loadListing() {
      if (!Number.isInteger(listingId) || listingId <= 0) {
        setError("Invalid listing ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [listingResponse, unavailableResponse] =
          await Promise.all([
            fetch(`${API_URL}/listings/${listingId}`, {
              cache: "no-store",
            }),
            fetch(
              `${API_URL}/listings/${listingId}/unavailable-dates`,
              {
                cache: "no-store",
              },
            ),
          ]);

        if (!listingResponse.ok) {
          throw new Error("Listing not found.");
        }

        const listingData =
          (await listingResponse.json()) as Listing;

        setListing(listingData);

        if (unavailableResponse.ok) {
          const unavailableData =
            (await unavailableResponse.json()) as UnavailableDate[];

          setUnavailableDates(unavailableData);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the listing.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadListing();
  }, [listingId]);

  const nights = useMemo(
    () => getNights(checkIn, checkOut),
    [checkIn, checkOut],
  );

  const nightlyTotal =
    listing && nights > 0
      ? listing.price_per_night * nights
      : 0;

  const totalPrice =
    listing && nights > 0
      ? nightlyTotal +
        listing.cleaning_fee +
        listing.service_fee
      : 0;

  const galleryImages = useMemo(() => {
    if (!listing) {
      return [];
    }

    const additionalImages = listing.image_urls
      ? listing.image_urls
          .split(",")
          .map((image) => image.trim())
          .filter(Boolean)
      : [];

    return Array.from(
      new Set([listing.image_url, ...additionalImages]),
    );
  }, [listing]);

  function datesOverlap(): boolean {
    if (!checkIn || !checkOut) {
      return false;
    }

    return unavailableDates.some((range) => {
      return (
        checkIn < range.check_out &&
        checkOut > range.check_in
      );
    });
  }

  async function handleBooking() {
    if (!listing) {
      return;
    }

    setBookingMessage("");

    if (!checkIn || !checkOut) {
      setBookingMessage(
        "Please select both check-in and check-out dates.",
      );
      return;
    }

    if (nights <= 0) {
      setBookingMessage(
        "Check-out must be after the check-in date.",
      );
      return;
    }

    if (datesOverlap()) {
      setBookingMessage(
        "The selected dates overlap with an existing booking.",
      );
      return;
    }

    try {
      setBooking(true);

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listing_id: listing.id,
          guest_id: 1,
          check_in: checkIn,
          check_out: checkOut,
          guests: Number(guests),
        }),
      });

      const responseData = (await response.json()) as
        | BookingResponse
        | { detail?: string };

      if (!response.ok) {
        throw new Error(
          "detail" in responseData && responseData.detail
            ? responseData.detail
            : "Unable to complete the booking.",
        );
      }

      const confirmedBooking =
        responseData as BookingResponse;

      setBookingMessage(
        `Booking confirmed! Confirmation #${confirmedBooking.id}`,
      );

      setUnavailableDates((currentDates) => [
        ...currentDates,
        {
          booking_id: confirmedBooking.id,
          check_in: confirmedBooking.check_in,
          check_out: confirmedBooking.check_out,
        },
      ]);
    } catch (bookingError) {
      setBookingMessage(
        bookingError instanceof Error
          ? bookingError.message
          : "Unable to complete the booking.",
      );
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <main className="detail-status-page">
        <div className="loader" />
        <p>Loading your stay...</p>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="detail-status-page">
        <h1>Listing unavailable</h1>
        <p>{error || "This listing could not be found."}</p>
        <a className="back-home-button" href="/">
          Return home
        </a>
      </main>
    );
  }

  const amenities = listing.amenities
    ? listing.amenities
        .split(",")
        .map((amenity) => amenity.trim())
        .filter(Boolean)
    : [];

  return (
    <main className="detail-page">
      <header className="detail-header">
        <a className="brand" href="/">
          <span className="brand-icon">⌂</span>
          <span>airbnb</span>
        </a>

        <a className="back-link" href="/">
          ← Back to stays
        </a>
      </header>

      <section className="detail-container">
        <div className="detail-title-section">
          <h1>{listing.title}</h1>

          <div className="detail-meta">
            <span>★ {listing.rating.toFixed(2)}</span>
            <span>·</span>
            <span>{listing.review_count} reviews</span>
            <span>·</span>
            <span>
              {listing.location}, {listing.country}
            </span>
          </div>
        </div>

        <section className="photo-gallery">
          {galleryImages.slice(0, 5).map((image, index) => (
            <div
              className={
                index === 0
                  ? "gallery-image gallery-main-image"
                  : "gallery-image"
              }
              key={`${image}-${index}`}
            >
              <img
                alt={`${listing.title} photo ${index + 1}`}
                src={image}
              />
            </div>
          ))}
        </section>

        <div className="detail-layout">
          <div className="detail-content">
            <section className="host-summary">
              <div>
                <h2>
                  {listing.property_type} hosted by{" "}
                  {listing.host?.name ?? "Airbnb Host"}
                </h2>

                <p>
                  {listing.max_guests} guests ·{" "}
                  {listing.bedrooms} bedrooms ·{" "}
                  {listing.beds} beds ·{" "}
                  {listing.bathrooms} bathrooms
                </p>
              </div>

              {listing.host?.avatar_url ? (
                <img
                  alt={listing.host.name}
                  className="host-avatar"
                  src={listing.host.avatar_url}
                />
              ) : (
                <div className="host-avatar-placeholder">H</div>
              )}
            </section>

            <section className="detail-feature-list">
              <div>
                <span className="feature-icon">★</span>
                <div>
                  <h3>Guest favourite</h3>
                  <p>
                    One of the most loved homes based on ratings
                    and reviews.
                  </p>
                </div>
              </div>

              <div>
                <span className="feature-icon">⌂</span>
                <div>
                  <h3>Entire place</h3>
                  <p>
                    You will have the property entirely to
                    yourself.
                  </p>
                </div>
              </div>

              <div>
                <span className="feature-icon">✓</span>
                <div>
                  <h3>Mocked instant booking</h3>
                  <p>
                    Reserve immediately without real payment.
                  </p>
                </div>
              </div>
            </section>

            <section className="description-section">
              <h2>About this place</h2>
              <p>{listing.description}</p>
            </section>

            <section className="amenities-section">
              <h2>What this place offers</h2>

              <div className="amenities-grid">
                {amenities.map((amenity) => (
                  <div className="amenity-item" key={amenity}>
                    <span>✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="reviews-section">
              <h2>
                ★ {listing.rating.toFixed(2)} ·{" "}
                {listing.review_count} reviews
              </h2>

              <div className="review-grid">
                <article className="review-card">
                  <div className="review-author">
                    <div className="review-avatar">A</div>
                    <div>
                      <strong>Ananya</strong>
                      <p>June 2026</p>
                    </div>
                  </div>

                  <p>
                    Beautiful property, accurate photos, and a
                    smooth check-in experience.
                  </p>
                </article>

                <article className="review-card">
                  <div className="review-author">
                    <div className="review-avatar">R</div>
                    <div>
                      <strong>Rahul</strong>
                      <p>May 2026</p>
                    </div>
                  </div>

                  <p>
                    The host was helpful and the location was
                    perfect for our trip.
                  </p>
                </article>
              </div>
            </section>
          </div>

          <aside className="booking-card">
            <div className="booking-price">
              <strong>
                {currencyFormatter.format(
                  listing.price_per_night,
                )}
              </strong>
              <span> night</span>
            </div>

            <div className="booking-input-grid">
              <label>
                <span>CHECK-IN</span>
                <input
                  min={getToday()}
                  onChange={(event) => {
                    setCheckIn(event.target.value);
                    setBookingMessage("");
                  }}
                  type="date"
                  value={checkIn}
                />
              </label>

              <label>
                <span>CHECKOUT</span>
                <input
                  min={checkIn || getToday()}
                  onChange={(event) => {
                    setCheckOut(event.target.value);
                    setBookingMessage("");
                  }}
                  type="date"
                  value={checkOut}
                />
              </label>

              <label className="guest-selector">
                <span>GUESTS</span>
                <select
                  onChange={(event) =>
                    setGuests(event.target.value)
                  }
                  value={guests}
                >
                  {Array.from(
                    { length: listing.max_guests },
                    (_, index) => index + 1,
                  ).map((guestCount) => (
                    <option
                      key={guestCount}
                      value={guestCount}
                    >
                      {guestCount}{" "}
                      {guestCount === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              className="reserve-button"
              disabled={booking}
              onClick={() => void handleBooking()}
              type="button"
            >
              {booking ? "Reserving..." : "Reserve"}
            </button>

            <p className="payment-note">
              You will not be charged. Payment is mocked.
            </p>

            {nights > 0 && (
              <div className="price-breakdown">
                <div>
                  <span>
                    {currencyFormatter.format(
                      listing.price_per_night,
                    )}{" "}
                    × {nights} nights
                  </span>
                  <span>
                    {currencyFormatter.format(nightlyTotal)}
                  </span>
                </div>

                <div>
                  <span>Cleaning fee</span>
                  <span>
                    {currencyFormatter.format(
                      listing.cleaning_fee,
                    )}
                  </span>
                </div>

                <div>
                  <span>Service fee</span>
                  <span>
                    {currencyFormatter.format(
                      listing.service_fee,
                    )}
                  </span>
                </div>

                <div className="price-total">
                  <strong>Total</strong>
                  <strong>
                    {currencyFormatter.format(totalPrice)}
                  </strong>
                </div>
              </div>
            )}

            {bookingMessage && (
              <p
                className={
                  bookingMessage.startsWith("Booking confirmed")
                    ? "booking-message booking-success"
                    : "booking-message booking-error"
                }
              >
                {bookingMessage}
              </p>
            )}

            {unavailableDates.length > 0 && (
              <div className="unavailable-dates">
                <h3>Unavailable dates</h3>

                {unavailableDates.map((range) => (
                  <p key={range.booking_id}>
                    {range.check_in} to {range.check_out}
                  </p>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}