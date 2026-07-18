"use client";
import Link from "next/link";



/* eslint-disable @next/next/no-img-element */

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import type {
  Listing,
  PaginatedListings,
} from "@/types/listing";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

const categories = [
  "All",
  "Amazing pools",
  "Beachfront",
  "City",
  "Cabins",
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [locationInput, setLocationInput] = useState("");
  const [guestInput, setGuestInput] = useState("1");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedGuests, setAppliedGuests] = useState("1");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  useEffect(() => {
    const controller = new AbortController();

    async function loadListings() {
      setLoading(true);
      setError("");

      try {
        const searchParams = new URLSearchParams({
          page: "1",
          page_size: "12",
        });

        if (appliedSearch.trim()) {
          searchParams.set(
            "search",
            appliedSearch.trim(),
          );
        }

        if (
          selectedCategory &&
          selectedCategory !== "All"
        ) {
          searchParams.set(
            "category",
            selectedCategory,
          );
        }

        if (Number(appliedGuests) > 0) {
          searchParams.set(
            "guests",
            appliedGuests,
          );
        }

        const response = await fetch(
          `${API_URL}/listings?${searchParams.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load listings (${response.status})`,
          );
        }

        const data =
          (await response.json()) as PaginatedListings;

        setListings(data.items);
      } catch (requestError) {
        if (
          requestError instanceof Error &&
          requestError.name !== "AbortError"
        ) {
          setError(
            "Could not connect to the backend. Make sure FastAPI is running on port 8000.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadListings();

    return () => {
      controller.abort();
    };
  }, [
    appliedGuests,
    appliedSearch,
    selectedCategory,
  ]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAppliedSearch(locationInput);
    setAppliedGuests(guestInput);
  }

  function clearFilters() {
    setLocationInput("");
    setGuestInput("1");
    setCheckIn("");
    setCheckOut("");
    setAppliedSearch("");
    setAppliedGuests("1");
    setSelectedCategory("All");
  }

  return (
    <main>
      <header className="site-header">
        <div className="header-content">
          <a className="brand" href="/">
            <span className="brand-icon">⌂</span>
            <span>airbnb</span>
          </a>

          <nav className="main-navigation">
            <button className="nav-link nav-link-active">
              Stays
            </button>

            <button className="nav-link">
              Experiences
            </button>
          </nav>

          <div className="header-actions">
            <Link className="trips-header-link" href="/trips">
              Trips
            </Link>
            <Link className="host-button host-button-link" href="/host">
                Airbnb your home
            </Link>

            <button
              aria-label="User menu"
              className="profile-button"
            >
              <span>☰</span>
              <span className="profile-avatar">●</span>
            </button>
          </div>
        </div>

        <form
          className="search-panel"
          onSubmit={handleSearch}
        >
          <label className="search-field location-field">
            <span>Where</span>

            <input
              onChange={(event) =>
                setLocationInput(event.target.value)
              }
              placeholder="Search destinations"
              type="text"
              value={locationInput}
            />
          </label>

          <label className="search-field">
            <span>Check in</span>

            <input
              min={new Date()
                .toISOString()
                .split("T")[0]}
              onChange={(event) =>
                setCheckIn(event.target.value)
              }
              type="date"
              value={checkIn}
            />
          </label>

          <label className="search-field">
            <span>Check out</span>

            <input
              min={
                checkIn ||
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              onChange={(event) =>
                setCheckOut(event.target.value)
              }
              type="date"
              value={checkOut}
            />
          </label>

          <label className="search-field guest-field">
            <span>Who</span>

            <select
              onChange={(event) =>
                setGuestInput(event.target.value)
              }
              value={guestInput}
            >
              <option value="1">1 guest</option>
              <option value="2">2 guests</option>
              <option value="3">3 guests</option>
              <option value="4">4 guests</option>
              <option value="5">5 guests</option>
              <option value="6">6 guests</option>
              <option value="7">7 guests</option>
              <option value="8">8 guests</option>
            </select>
          </label>

          <button
            aria-label="Search listings"
            className="search-button"
            type="submit"
          >
            <span>⌕</span>
            <span className="search-button-text">
              Search
            </span>
          </button>
        </form>
      </header>

      <section className="category-section">
        <div className="category-list">
          {categories.map((category) => (
            <button
              className={
                selectedCategory === category
                  ? "category-button category-button-active"
                  : "category-button"
              }
              key={category}
              onClick={() =>
                setSelectedCategory(category)
              }
              type="button"
            >
              <span className="category-icon">
                {getCategoryIcon(category)}
              </span>

              <span>{category}</span>
            </button>
          ))}
        </div>

        <button
          className="filters-button"
          onClick={clearFilters}
          type="button"
        >
          <span>☷</span>
          Clear filters
        </button>
      </section>

      <section className="listing-section">
        <div className="section-heading">
          <div>
            <h1>Explore places to stay</h1>

            <p>
              Find homes, villas, cabins, and unique
              stays across India.
            </p>
          </div>

          {!loading && !error && (
            <p className="result-count">
              {listings.length}{" "}
              {listings.length === 1
                ? "stay"
                : "stays"}
            </p>
          )}
        </div>

        {loading && (
          <div className="status-card">
            <div className="loader" />
            <p>Finding amazing stays...</p>
          </div>
        )}

        {!loading && error && (
          <div className="status-card error-card">
            <h2>Backend unavailable</h2>
            <p>{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          listings.length === 0 && (
            <div className="status-card">
              <h2>No stays found</h2>

              <p>
                Try another destination, category, or
                guest count.
              </p>

              <button
                className="reset-button"
                onClick={clearFilters}
                type="button"
              >
                Clear search
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          listings.length > 0 && (
            <div className="listing-grid">
              {listings.map((listing) => (
                <article className="listing-card" key={listing.id}>
                <Link
                  className="listing-card-link"
                  href={`/listings/${listing.id}`}
                >
                  <div className="image-wrapper">
                    <img
                      alt={listing.title}
                      className="listing-image"
                      loading="lazy"
                      src={listing.image_url}
                    />

                    <span className="favourite-button">♡</span>

                    <span className="guest-favourite">
                      Guest favourite
                    </span>
                  </div>

                  <div className="listing-information">
                    <div className="listing-title-row">
                      <h2>{listing.location}</h2>

                      <span className="rating">
                        ★ {listing.rating.toFixed(2)}
                      </span>
                    </div>

                    <p className="listing-name">
                      {listing.title}
                    </p>

                    <p className="listing-details">
                      {listing.bedrooms} bedroom
                      {listing.bedrooms === 1
                        ? ""
                        : "s"}{" "}
                      · {listing.beds} bed
                      {listing.beds === 1 ? "" : "s"} ·{" "}
                      Up to {listing.max_guests} guests
                    </p>

                    <p className="listing-price">
                      <strong>
                        {currencyFormatter.format(
                          listing.price_per_night,
                        )}
                      </strong>{" "}
                      night
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="site-footer">
        <p>
          © 2026 Airbnb Clone · Built with Next.js and
          FastAPI
        </p>

        <div>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </footer>
    </main>
  );
}

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    All: "⌂",
    "Amazing pools": "♒",
    Beachfront: "☀",
    City: "▦",
    Cabins: "△",
  };

  return icons[category] ?? "⌂";
}