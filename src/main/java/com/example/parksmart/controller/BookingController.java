package com.example.parksmart.controller;

import com.example.parksmart.model.Booking;
import com.example.parksmart.model.User;
import com.example.parksmart.repo.UserRepo;
import com.example.parksmart.service.BookingService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService service;
    private final UserRepo userRepo;

    public BookingController(
            BookingService service,
            UserRepo userRepo) {

        this.service = service;
        this.userRepo = userRepo;
    }

    /**
     * Create a booking. Only CUSTOMER can create bookings. Links the booking to the authenticated customer.
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Booking> create(
            @Valid @RequestBody Booking booking,
            Authentication auth) {

        // Link booking to authenticated user
        User user = userRepo.findByUsername(auth.getName()).orElse(null);
        if (user != null) {
            booking.setUser(user);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(booking));
    }

    /**
     * Get all bookings — ADMIN and PARKING_MANAGER only.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER')")
    public ResponseEntity<List<Booking>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /**
     * Get booking by ID.
     * ADMIN/MANAGER can get any booking.
     * CUSTOMER can only get their own booking.
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Booking> getById(
            @PathVariable Long id,
            Authentication auth) {

        Booking booking = service.getById(id);

        // Customers can only view their own bookings
        if (isCustomer(auth)) {
            assertOwnership(booking, auth.getName());
        }

        return ResponseEntity.ok(booking);
    }

    /**
     * Get my bookings — CUSTOMER sees only their own.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication auth) {
        User user = userRepo.findByUsername(auth.getName())
                .orElseThrow();
        return ResponseEntity.ok(service.getByUser(user.getId()));
    }

    /**
     * Update booking.
     * ADMIN/MANAGER can update any.
     * CUSTOMER can only update their own.
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Booking> update(
            @PathVariable Long id,
            @Valid @RequestBody Booking booking,
            Authentication auth) {

        if (isCustomer(auth)) {
            Booking existing = service.getById(id);
            assertOwnership(existing, auth.getName());
        }

        return ResponseEntity.ok(service.update(id, booking));
    }

    /**
     * Cancel booking.
     * ADMIN/MANAGER can cancel any.
     * CUSTOMER can only cancel their own.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> cancel(
            @PathVariable Long id,
            Authentication auth) {

        if (isCustomer(auth)) {
            Booking existing = service.getById(id);
            assertOwnership(existing, auth.getName());
        }

        service.cancel(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/slot/{slotId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER')")
    public ResponseEntity<List<Booking>> getBySlot(
            @PathVariable Long slotId) {

        return ResponseEntity.ok(service.getBySlot(slotId));
    }

    @GetMapping("/available/{lotId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<?>> getAvailableSlots(
            @PathVariable Long lotId,
            @RequestParam LocalDateTime startTime,
            @RequestParam LocalDateTime endTime) {

        return ResponseEntity.ok(
                service.getAvailableSlots(lotId, startTime, endTime)
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private boolean isCustomer(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
    }

    private void assertOwnership(Booking booking, String username) {
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null || service.getByUser(user.getId()).stream()
            .noneMatch(userBooking -> userBooking.getId().equals(booking.getId()))) {
            throw new AccessDeniedException(
                    "You do not have permission to access this booking."
            );
        }
    }
}
