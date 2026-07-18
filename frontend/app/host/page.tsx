"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Booking } from "@/types/booking";
import type { Listing } from "@/types/listing";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

const HOST_ID = 2;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

interface ListingFormState {
  title: string;
  description: string;
  location: string;
  country: string;
  property_type: string;
  category: string;
  price_per_night: string;
  cleaning_fee: string;
  service_fee: string;
  max_guests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  image_url: string;
  image_urls: string;
  amenities: string;
}

const emptyForm: ListingFormState = {
  title: "",
  description: "",
  location: "",
  country: "India",
  property_type: "Apartment",
  category: "City",
  price_per_night: "4000",
  cleaning_fee: "500",
  service_fee: "350",
  max_guests: "2",
  bedrooms: "1",
  beds: "1",
  bathrooms: "1",
  image_url:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  image_urls: "",
  amenities: "WiFi,Kitchen,Air conditioning,Parking",
};

export default function HostDashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [form, setForm] =
    useState<ListingFormState>(emptyForm);

  const [editingListingId, setEditingListingId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [listingsResponse, bookingsResponse] =
        await Promise.all([
          fetch(`${API_URL}/hosts/${HOST_ID}/listings`, {
            cache: "no-store",
          }),
          fetch(`${API_URL}/hosts/${HOST_ID}/bookings`, {
            cache: "no-store",
          }),
        ]);

      if (!listingsResponse.ok) {
        throw new Error(
          `Unable to load host listings (${listingsResponse.status})`,
        );
      }

      if (!bookingsResponse.ok) {
        throw new Error(
          `Unable to load host bookings (${bookingsResponse.status})`,
        );
      }

      const listingData =
        (await listingsResponse.json()) as Listing[];

      const bookingData =
        (await bookingsResponse.json()) as Booking[];

      setListings(listingData);
      setBookings(bookingData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the host dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeListings = useMemo(
    () => listings.filter((listing) => listing.is_active),
    [listings],
  );

  const totalBookingRevenue = useMemo(
    () =>
      bookings.reduce(
        (total, booking) =>
          booking.status === "confirmed"
            ? total + booking.total_price
            : total,
        0,
      ),
    [bookings],
  );

  function updateField(
    field: keyof ListingFormState,
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingListingId(null);
    setMessage("");
  }

  function startEditing(listing: Listing) {
    setEditingListingId(listing.id);

    setForm({
      title: listing.title,
      description: listing.description,
      location: listing.location,
      country: listing.country,
      property_type: listing.property_type,
      category: listing.category,
      price_per_night: String(listing.price_per_night),
      cleaning_fee: String(listing.cleaning_fee),
      service_fee: String(listing.service_fee),
      max_guests: String(listing.max_guests),
      bedrooms: String(listing.bedrooms),
      beds: String(listing.beds),
      bathrooms: String(listing.bathrooms),
      image_url: listing.image_url,
      image_urls: listing.image_urls ?? "",
      amenities: listing.amenities ?? "",
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      country: form.country.trim(),
      property_type: form.property_type.trim(),
      category: form.category.trim(),
      price_per_night: Number(form.price_per_night),
      cleaning_fee: Number(form.cleaning_fee),
      service_fee: Number(form.service_fee),
      max_guests: Number(form.max_guests),
      bedrooms: Number(form.bedrooms),
      beds: Number(form.beds),
      bathrooms: Number(form.bathrooms),
      image_url: form.image_url.trim(),
      image_urls: form.image_urls.trim() || null,
      amenities: form.amenities.trim() || null,
    };

    try {
      const editing = editingListingId !== null;

      const response = await fetch(
        editing
          ? `${API_URL}/listings/${editingListingId}`
          : `${API_URL}/listings`,
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            editing
              ? payload
              : {
                  ...payload,
                  host_id: HOST_ID,
                },
          ),
        },
      );

      const responseData = (await response.json()) as
        | Listing
        | { detail?: string };

      if (!response.ok) {
        throw new Error(
          "detail" in responseData && responseData.detail
            ? responseData.detail
            : "Unable to save the listing.",
        );
      }

      setMessage(
        editing
          ? "Listing updated successfully."
          : "Listing created successfully.",
      );

      setForm(emptyForm);
      setEditingListingId(null);

      await loadDashboard();
    } catch (saveError) {
      setMessage(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the listing.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteListing(listing: Listing) {
    const confirmed = window.confirm(
      `Delete "${listing.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      const response = await fetch(
        `${API_URL}/listings/${listing.id}`,
        {
          method: "DELETE",
        },
      );

      const responseData = (await response.json()) as {
        detail?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          responseData.detail ??
            "Unable to delete the listing.",
        );
      }

      setMessage("Listing deleted successfully.");

      await loadDashboard();
    } catch (deleteError) {
      setMessage(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the listing.",
      );
    }
  }

  return (
    <main className="host-page">
      <header className="detail-header">
        <Link className="brand" href="/">
          <span className="brand-icon">⌂</span>
          <span>airbnb</span>
        </Link>

        <nav className="host-navigation">
          <Link href="/">Explore</Link>
          <Link href="/trips">Trips</Link>
          <Link className="host-navigation-active" href="/host">
            Host dashboard
          </Link>
        </nav>
      </header>

      <section className="host-container">
        <div className="host-dashboard-heading">
          <div>
            <p className="trips-eyebrow">Host account</p>
            <h1>Welcome, Aarav</h1>
            <p>
              Manage your properties, reservations, and listing
              details.
            </p>
          </div>

          <button
            className="host-refresh-button"
            onClick={() => void loadDashboard()}
            type="button"
          >
            Refresh dashboard
          </button>
        </div>

        {loading && (
          <div className="status-card">
            <div className="loader" />
            <p>Loading host dashboard...</p>
          </div>
        )}

        {!loading && error && (
          <div className="status-card error-card">
            <h2>Dashboard unavailable</h2>
            <p>{error}</p>

            <button
              className="reset-button"
              onClick={() => void loadDashboard()}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="host-stat-grid">
              <article className="host-stat-card">
                <span>Active listings</span>
                <strong>{activeListings.length}</strong>
              </article>

              <article className="host-stat-card">
                <span>Reservations</span>
                <strong>{bookings.length}</strong>
              </article>

              <article className="host-stat-card">
                <span>Mock revenue</span>
                <strong>
                  {currencyFormatter.format(
                    totalBookingRevenue,
                  )}
                </strong>
              </article>
            </section>

            <section className="host-form-section">
              <div className="host-section-heading">
                <div>
                  <h2>
                    {editingListingId
                      ? "Edit listing"
                      : "Create a listing"}
                  </h2>

                  <p>
                    Add the property information displayed to
                    guests.
                  </p>
                </div>

                {editingListingId && (
                  <button
                    className="host-secondary-button"
                    onClick={resetForm}
                    type="button"
                  >
                    Cancel editing
                  </button>
                )}
              </div>

              <form
                className="host-listing-form"
                onSubmit={handleSubmit}
              >
                <label>
                  <span>Listing title</span>
                  <input
                    minLength={3}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="Luxury villa with pool"
                    required
                    value={form.title}
                  />
                </label>

                <label>
                  <span>Location</span>
                  <input
                    onChange={(event) =>
                      updateField(
                        "location",
                        event.target.value,
                      )
                    }
                    placeholder="Goa"
                    required
                    value={form.location}
                  />
                </label>

                <label>
                  <span>Country</span>
                  <input
                    onChange={(event) =>
                      updateField(
                        "country",
                        event.target.value,
                      )
                    }
                    required
                    value={form.country}
                  />
                </label>

                <label>
                  <span>Property type</span>
                  <select
                    onChange={(event) =>
                      updateField(
                        "property_type",
                        event.target.value,
                      )
                    }
                    value={form.property_type}
                  >
                    <option value="Apartment">
                      Apartment
                    </option>
                    <option value="Villa">Villa</option>
                    <option value="Cabin">Cabin</option>
                    <option value="Cottage">Cottage</option>
                    <option value="Houseboat">
                      Houseboat
                    </option>
                    <option value="Heritage home">
                      Heritage home
                    </option>
                  </select>
                </label>

                <label>
                  <span>Category</span>
                  <select
                    onChange={(event) =>
                      updateField(
                        "category",
                        event.target.value,
                      )
                    }
                    value={form.category}
                  >
                    <option value="City">City</option>
                    <option value="Amazing pools">
                      Amazing pools
                    </option>
                    <option value="Beachfront">
                      Beachfront
                    </option>
                    <option value="Cabins">Cabins</option>
                    <option value="Historical homes">
                      Historical homes
                    </option>
                    <option value="Boats">Boats</option>
                  </select>
                </label>

                <label>
                  <span>Price per night</span>
                  <input
                    min="1"
                    onChange={(event) =>
                      updateField(
                        "price_per_night",
                        event.target.value,
                      )
                    }
                    required
                    type="number"
                    value={form.price_per_night}
                  />
                </label>

                <label>
                  <span>Cleaning fee</span>
                  <input
                    min="0"
                    onChange={(event) =>
                      updateField(
                        "cleaning_fee",
                        event.target.value,
                      )
                    }
                    required
                    type="number"
                    value={form.cleaning_fee}
                  />
                </label>

                <label>
                  <span>Service fee</span>
                  <input
                    min="0"
                    onChange={(event) =>
                      updateField(
                        "service_fee",
                        event.target.value,
                      )
                    }
                    required
                    type="number"
                    value={form.service_fee}
                  />
                </label>

                <label>
                  <span>Maximum guests</span>
                  <input
                    min="1"
                    onChange={(event) =>
                      updateField(
                        "max_guests",
                        event.target.value,
                      )
                    }
                    required
                    type="number"
                    value={form.max_guests}
                  />
                </label>

                <label>
                  <span>Bedrooms</span>
                  <input
                    min="0"
                    onChange={(event) =>
                      updateField(
                        "bedrooms",
                        event.target.value,
                      )
                    }
                    required
                    type="number"
                    value={form.bedrooms}
                  />
                </label>

                <label>
                  <span>Beds</span>
                  <input
                    min="1"
                    onChange={(event) =>
                      updateField("beds", event.target.value)
                    }
                    required
                    type="number"
                    value={form.beds}
                  />
                </label>

                <label>
                  <span>Bathrooms</span>
                  <input
                    min="0.5"
                    onChange={(event) =>
                      updateField(
                        "bathrooms",
                        event.target.value,
                      )
                    }
                    required
                    step="0.5"
                    type="number"
                    value={form.bathrooms}
                  />
                </label>

                <label className="host-form-full-width">
                  <span>Main image URL</span>
                  <input
                    onChange={(event) =>
                      updateField(
                        "image_url",
                        event.target.value,
                      )
                    }
                    required
                    type="url"
                    value={form.image_url}
                  />
                </label>

                <label className="host-form-full-width">
                  <span>
                    Additional image URLs, separated by commas
                  </span>
                  <input
                    onChange={(event) =>
                      updateField(
                        "image_urls",
                        event.target.value,
                      )
                    }
                    value={form.image_urls}
                  />
                </label>

                <label className="host-form-full-width">
                  <span>Amenities, separated by commas</span>
                  <input
                    onChange={(event) =>
                      updateField(
                        "amenities",
                        event.target.value,
                      )
                    }
                    value={form.amenities}
                  />
                </label>

                <label className="host-form-full-width">
                  <span>Description</span>
                  <textarea
                    minLength={10}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Describe the property..."
                    required
                    rows={5}
                    value={form.description}
                  />
                </label>

                <div className="host-form-actions">
                  <button
                    className="reserve-button"
                    disabled={saving}
                    type="submit"
                  >
                    {saving
                      ? "Saving..."
                      : editingListingId
                        ? "Save changes"
                        : "Create listing"}
                  </button>
                </div>
              </form>

              {message && (
                <p className="host-action-message">{message}</p>
              )}
            </section>

            <section className="host-dashboard-section">
              <div className="host-section-heading">
                <div>
                  <h2>Your listings</h2>
                  <p>
                    Edit or remove properties from the
                    marketplace.
                  </p>
                </div>
              </div>

              {listings.length === 0 ? (
                <p>No host listings are available.</p>
              ) : (
                <div className="host-listing-grid">
                  {listings.map((listing) => (
                    <article
                      className={
                        listing.is_active
                          ? "host-listing-card"
                          : "host-listing-card host-listing-inactive"
                      }
                      key={listing.id}
                    >
                      <img
                        alt={listing.title}
                        src={listing.image_url}
                      />

                      <div className="host-listing-card-content">
                        <div className="host-listing-title-row">
                          <div>
                            <span>{listing.location}</span>
                            <h3>{listing.title}</h3>
                          </div>

                          <span
                            className={
                              listing.is_active
                                ? "host-listing-status"
                                : "host-listing-status inactive"
                            }
                          >
                            {listing.is_active
                              ? "Active"
                              : "Deleted"}
                          </span>
                        </div>

                        <p>
                          {currencyFormatter.format(
                            listing.price_per_night,
                          )}{" "}
                          per night · {listing.max_guests} guests
                        </p>

                        <div className="host-card-actions">
                          {listing.is_active && (
                            <>
                              <Link
                                href={`/listings/${listing.id}`}
                              >
                                View
                              </Link>

                              <button
                                onClick={() =>
                                  startEditing(listing)
                                }
                                type="button"
                              >
                                Edit
                              </button>

                              <button
                                className="host-delete-button"
                                onClick={() =>
                                  void deleteListing(listing)
                                }
                                type="button"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="host-dashboard-section">
              <div className="host-section-heading">
                <div>
                  <h2>Reservations</h2>
                  <p>
                    Confirmed guest bookings across your
                    properties.
                  </p>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="empty-host-bookings">
                  No reservations yet.
                </div>
              ) : (
                <div className="host-booking-table-wrapper">
                  <table className="host-booking-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Dates</th>
                        <th>Guests</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            {booking.listing?.title ??
                              `Listing ${booking.listing_id}`}
                          </td>
                          <td>
                            {booking.check_in} →{" "}
                            {booking.check_out}
                          </td>
                          <td>{booking.guests}</td>
                          <td>
                            {currencyFormatter.format(
                              booking.total_price,
                            )}
                          </td>
                          <td>
                            <span className="host-booking-status">
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}