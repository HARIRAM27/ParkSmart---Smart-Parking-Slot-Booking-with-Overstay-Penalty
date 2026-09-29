package com.example.parksmart.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.parksmart.model.Booking;
import com.example.parksmart.model.CheckInOut;
import com.example.parksmart.model.User;
import com.example.parksmart.repo.UserRepo;
import com.example.parksmart.service.BookingService;
import com.example.parksmart.service.CheckInOutService;

@RestController
@RequestMapping("/api/checkinout")
public class CheckInOutController {

    private final CheckInOutService service;
    private final BookingService bookingService;
    private final UserRepo userRepo;

    public CheckInOutController(
            CheckInOutService service,
            BookingService bookingService,
            UserRepo userRepo) {

        this.service = service;
        this.bookingService = bookingService;
        this.userRepo = userRepo;
    }

    @PostMapping("/checkin/{bookingId}")
    @PreAuthorize("hasRole('PARKING_MANAGER')")
    public ResponseEntity<CheckInOut> checkIn(
            @PathVariable Long bookingId) {

        return ResponseEntity.ok(
                service.checkIn(bookingId)
        );
    }

    @PutMapping("/checkout/{bookingId}")
    @PreAuthorize("hasRole('PARKING_MANAGER')")
    public ResponseEntity<CheckInOut> checkOut(
            @PathVariable Long bookingId) {

        return ResponseEntity.ok(
                service.checkOut(bookingId)
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER')")
    public ResponseEntity<List<CheckInOut>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CheckInOut> getByBooking(
            @PathVariable Long bookingId,
            Authentication auth) {

        if (isCustomer(auth)) {
            Booking booking = bookingService.getById(bookingId);
            assertBookingOwnership(booking, auth.getName());
        }

        return ResponseEntity.ok(
                service.getByBookingId(bookingId)
        );
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<CheckInOut>> getMyCheckInOut(Authentication auth) {
        User user = userRepo.findByUsername(auth.getName()).orElseThrow();
        List<Booking> myBookings = bookingService.getByUser(user.getId());
        List<CheckInOut> myRecords = myBookings.stream()
                .map(b -> {
                    try {
                        return service.getByBookingId(b.getId());
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();

        return ResponseEntity.ok(myRecords);
    }

    @GetMapping("/occupancy/{lotId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARKING_MANAGER')")
    public ResponseEntity<Map<String, Object>> occupancy(
            @PathVariable Long lotId) {

        long occupied =
                service.getCurrentOccupancy(lotId);

        return ResponseEntity.ok(
                Map.of(
                        "lotId", lotId,
                        "occupiedSlots", occupied
                )
        );
    }

    private boolean isCustomer(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
    }

    private void assertBookingOwnership(Booking booking, String username) {
        User user = userRepo.findByUsername(username).orElse(null);
        if (user == null || bookingService.getByUser(user.getId()).stream()
                .noneMatch(b -> b.getId().equals(booking.getId()))) {
            throw new AccessDeniedException(
                    "You do not have permission to access this check-in record."
            );
        }
    }
}