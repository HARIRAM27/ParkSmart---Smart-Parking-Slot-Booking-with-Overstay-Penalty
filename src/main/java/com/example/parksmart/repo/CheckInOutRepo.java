package com.example.parksmart.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parksmart.model.CheckInOut;

public interface CheckInOutRepo extends JpaRepository<CheckInOut, Long> {

    Optional<CheckInOut> findByBookingId(Long bookingId);

    long countByBookingSlotParkingLotIdAndCheckOutTimeIsNull(
            Long lotId
    );
}