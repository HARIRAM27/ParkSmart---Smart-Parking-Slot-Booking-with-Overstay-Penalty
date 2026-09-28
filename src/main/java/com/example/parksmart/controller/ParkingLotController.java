package com.example.parksmart.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.parksmart.model.ParkingLot;
import com.example.parksmart.service.ParkingLotService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/lots")
public class ParkingLotController {

    private final ParkingLotService service;

    public ParkingLotController(
            ParkingLotService service) {

        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ParkingLot> create(
            @Valid @RequestBody ParkingLot parkingLot) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(parkingLot));
    }

    @GetMapping
    public ResponseEntity<List<ParkingLot>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParkingLot> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParkingLot> update(
            @PathVariable Long id,
            @Valid @RequestBody ParkingLot parkingLot) {

        return ResponseEntity.ok(
                service.update(id, parkingLot)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        service.delete(id);

        return ResponseEntity.noContent().build();
    }
}