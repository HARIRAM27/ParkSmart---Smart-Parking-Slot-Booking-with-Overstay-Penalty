package com.example.parksmart.controller;

import com.example.parksmart.model.Booking;
import com.example.parksmart.service.BookingService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService service;

    public BookingController(
            BookingService service) {

        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Booking> create(
            @Valid @RequestBody Booking booking) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(booking));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> update(
            @PathVariable Long id,
            @Valid @RequestBody Booking booking) {

        return ResponseEntity.ok(
                service.update(id, booking)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable Long id) {

        service.cancel(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/slot/{slotId}")
    public ResponseEntity<List<Booking>> getBySlot(
            @PathVariable Long slotId) {

        return ResponseEntity.ok(
                service.getBySlot(slotId)
        );
    }

    @GetMapping("/available/{lotId}")
    public ResponseEntity<List<?>> getAvailableSlots(
            @PathVariable Long lotId,
            @RequestParam LocalDateTime startTime,
            @RequestParam LocalDateTime endTime) {

        return ResponseEntity.ok(
                service.getAvailableSlots(
                        lotId,
                        startTime,
                        endTime
                )
        );
    }
}