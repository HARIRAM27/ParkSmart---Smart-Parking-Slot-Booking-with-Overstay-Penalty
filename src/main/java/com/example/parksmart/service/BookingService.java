package com.example.parksmart.service;

import com.example.parksmart.model.Booking;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingService {

    Booking create(Booking booking);

    List<Booking> getAll();

    Booking getById(Long id);

    Booking update(Long id, Booking booking);

    void cancel(Long id);

    List<Booking> getBySlot(Long slotId);

    List<?> getAvailableSlots(
            Long lotId,
            LocalDateTime startTime,
            LocalDateTime endTime
    );
}