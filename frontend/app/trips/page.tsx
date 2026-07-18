"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Booking } from "@/types/booking";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default function TripsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Guest authentication is mocked, so guest ID 1 is used.
      const response = await fetch(`${API_URL}/users/1/trips`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load your trips (${response.status})`,
        );
      }

      const data = (await response.json()) as Booking[];

      setBookings(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your trips.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const upcomingTrips = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return bookings.filter(
      (booking) =>
        booking.check_out >= today &&
        booking.status === "confirmed",
    );
  }, [bookings]);

  const previousTrips = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return bookings.filter(
      (booking) =>
        booking.check_out < today ||
        booking.status !== "confirmed",
    );
  }, [bookings]);

  return (
    <main className="trips-page">
      <header className="detail-header">
        <Link className="brand" href="/">
          <span className="brand-icon">⌂</span>
          <span>airbnb</span>
        </Link>

        <nav className="trips-navigation">
          <Link href="/">Explore stays</Link>
          <Link className="trips-navigation-active" href="/trips">
            Trips
          </Link>
        </nav>
      </header>

      <section className="trips-container">
        <div className="trips-heading">
          <div>
            <p className="trips-eyebrow">Guest account</p>
            <h1>My Trips</h1>
            <p>
              Review your confirmed bookings and upcoming stays.
            </p>
          </div>

          <Link className="explore-button" href="/">
            Explore more stays
          </Link>
        </div>

        {loading && (
          <div className="status-card">
            <div className="loader" />
            <p>Loading your trips...</p>
          </div>
        )}

        {!loading && error && (
          <div className="status-card error-card">
            <h2>Could not load trips</h2>
            <p>{error}</p>

            <button
              className="reset-button"
              onClick={() => void loadTrips()}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="empty-trips-card">
            <div className="empty-trips-icon">✈</div>

            <h2>No trips booked yet</h2>

            <p>
              Your confirmed Airbnb Clone bookings will appear
              here.
            </p>

            <Link className="explore-button" href="/">
              Start exploring
            </Link>
          </div>
        )}

        {!loading && !error && upcomingTrips.length > 0 && (
          <section className="trips-section">
            <div className="trips-section-heading">
              <h2>Upcoming reservations</h2>
              <span>
                {upcomingTrips.length}{" "}
                {upcomingTrips.length === 1
                  ? "booking"
                  : "bookings"}
              </span>
            </div>

            <div className="trip-grid">
              {upcomingTrips.map((booking) => (
                <TripCard booking={booking} key={booking.id} />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && previousTrips.length > 0 && (
          <section className="trips-section previous-trips-section">
            <div className="trips-section-heading">
              <h2>Previous trips</h2>
              <span>{previousTrips.length}</span>
            </div>

            <div className="trip-grid">
              {previousTrips.map((booking) => (
                <TripCard booking={booking} key={booking.id} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function TripCard({ booking }: { booking: Booking }) {
  const listing = booking.listing;

  return (
    <article className="trip-card">
      <div className="trip-card-image-wrapper">
        {listing?.image_url ? (
          <img
            alt={listing.title}
            className="trip-card-image"
            src={listing.image_url}
          />
        ) : (
          <div className="trip-card-image-placeholder">
            Property image unavailable
          </div>
        )}

        <span className="trip-status">
          {booking.status}
        </span>
      </div>

      <div className="trip-card-content">
        <div className="trip-card-heading">
          <div>
            <p className="trip-location">
              {listing?.location ?? "Reserved property"}
            </p>

            <h3>
              {listing?.title ?? `Listing ${booking.listing_id}`}
            </h3>
          </div>

          <span className="trip-confirmation">
            #{booking.id}
          </span>
        </div>

        <div className="trip-dates">
          <div>
            <span>CHECK-IN</span>
            <strong>{formatDate(booking.check_in)}</strong>
          </div>

          <div className="trip-date-divider" />

          <div>
            <span>CHECKOUT</span>
            <strong>{formatDate(booking.check_out)}</strong>
          </div>
        </div>

        <div className="trip-summary">
          <span>
            {booking.guests}{" "}
            {booking.guests === 1 ? "guest" : "guests"}
          </span>

          <span>·</span>

          <span>
            {booking.nights}{" "}
            {booking.nights === 1 ? "night" : "nights"}
          </span>

          <span>·</span>

          <strong>
            {currencyFormatter.format(booking.total_price)}
          </strong>
        </div>

        {listing && (
          <Link
            className="view-stay-link"
            href={`/listings/${listing.id}`}
          >
            View reservation
          </Link>
        )}
      </div>
    </article>
  );
}