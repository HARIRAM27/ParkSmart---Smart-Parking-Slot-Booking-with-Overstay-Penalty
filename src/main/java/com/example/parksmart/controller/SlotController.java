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

import com.example.parksmart.model.Slot;
import com.example.parksmart.service.SlotService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/slots")
public class SlotController {

    private final SlotService service;

    public SlotController(SlotService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Slot> create(
            @Valid @RequestBody Slot slot) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(slot));
    }

    @GetMapping
    public ResponseEntity<List<Slot>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Slot> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Slot> update(
            @PathVariable Long id,
            @Valid @RequestBody Slot slot) {

        return ResponseEntity.ok(
                service.update(id, slot)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        service.delete(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/lot/{lotId}")
    public ResponseEntity<List<Slot>> getByLot(
            @PathVariable Long lotId) {

        return ResponseEntity.ok(
                service.getActiveSlotsByLot(lotId)
        );
    }
}