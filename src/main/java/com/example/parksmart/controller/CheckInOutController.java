package com.example.parksmart.controller;

import com.example.parksmart.model.CheckInOut;
import com.example.parksmart.service.CheckInOutService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkinout")
public class CheckInOutController {

    private final CheckInOutService service;

    public CheckInOutController(
            CheckInOutService service) {

        this.service = service;
    }

    @PostMapping("/checkin/{bookingId}")
    public ResponseEntity<CheckInOut> checkIn(
            @PathVariable Long bookingId) {

        return ResponseEntity.ok(
                service.checkIn(bookingId)
        );
    }

    @PutMapping("/checkout/{bookingId}")
    public ResponseEntity<CheckInOut> checkOut(
            @PathVariable Long bookingId) {

        return ResponseEntity.ok(
                service.checkOut(bookingId)
        );
    }

    @GetMapping
    public ResponseEntity<List<CheckInOut>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<CheckInOut> getByBooking(
            @PathVariable Long bookingId) {

        return ResponseEntity.ok(
                service.getByBookingId(bookingId)
        );
    }

    @GetMapping("/occupancy/{lotId}")
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
}