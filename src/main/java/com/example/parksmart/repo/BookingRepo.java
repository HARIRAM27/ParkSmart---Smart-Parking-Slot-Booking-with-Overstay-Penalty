package com.example.parksmart.repo;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.parksmart.Enums.BookingStatus;
import com.example.parksmart.model.Booking;

public interface BookingRepo extends JpaRepository<Booking, Long> {

    @Query("""
        SELECT COUNT(b)
        FROM Booking b
        WHERE b.slot.id = :slotId
        AND b.status IN :statuses
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    long countOverlappingBookings(
            @Param("slotId") Long slotId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses
    );

    List<Booking> findBySlotId(Long slotId);

    List<Booking> findBySlotParkingLotId(Long lotId);

    long countBySlotParkingLotIdAndStatus(
            Long lotId,
            BookingStatus status
    );
}