package com.example.parksmart.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.parksmart.Enums.BookingStatus;
import com.example.parksmart.Enums.SlotStatus;
import com.example.parksmart.exception.BookingConflictException;
import com.example.parksmart.exception.InvalidBookingException;
import com.example.parksmart.exception.ResourceNotFoundException;
import com.example.parksmart.model.Booking;
import com.example.parksmart.model.Slot;
import com.example.parksmart.repo.BookingRepo;
import com.example.parksmart.repo.SlotRepo;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepo bookingRepository;
    private final SlotRepo slotRepository;

    public BookingServiceImpl(
            BookingRepo bookingRepository,
            SlotRepo slotRepository) {

        this.bookingRepository = bookingRepository;
        this.slotRepository = slotRepository;
    }

    @Override
    @Transactional
    public Booking create(Booking booking) {

        if (booking.getStartTime()
                .isAfter(booking.getEndTime())
                || booking.getStartTime()
                        .isEqual(booking.getEndTime())) {

            throw new InvalidBookingException(
                    "Booking start time must be before end time"
            );
        }

        Slot slot = slotRepository.findById(
                booking.getSlot().getId()
        ).orElseThrow(()
                -> new ResourceNotFoundException(
                        "Slot not found with id: "
                        + booking.getSlot().getId()
                ));

        if (slot.getStatus() != SlotStatus.ACTIVE) {

            throw new InvalidBookingException(
                    "Selected slot is not active"
            );
        }

        long conflicts
                = bookingRepository.countOverlappingBookings(
                        slot.getId(),
                        booking.getStartTime(),
                        booking.getEndTime(),
                        List.of(
                                BookingStatus.RESERVED,
                                BookingStatus.CHECKED_IN
                        )
                );

        if (conflicts > 0) {

            throw new BookingConflictException(
                    "Slot " + slot.getSlotNumber()
                    + " is already booked for the selected time window"
            );
        }

        booking.setSlot(slot);
        booking.setStatus(BookingStatus.RESERVED);

        return bookingRepository.save(booking);
    }

    @Override
    public List<Booking> getAll() {
        return bookingRepository.findAll();
    }

    @Override
    public Booking getById(Long id) {

        return bookingRepository.findById(id)
                .orElseThrow(()
                        -> new ResourceNotFoundException(
                        "Booking not found with id: " + id
                ));
    }

    @Override
    public Booking update(
            Long id,
            Booking booking) {

        Booking existing = getById(id);

        existing.setVehicleNumber(
                booking.getVehicleNumber()
        );

        existing.setCustomerName(
                booking.getCustomerName()
        );

        existing.setStartTime(
                booking.getStartTime()
        );

        existing.setEndTime(
                booking.getEndTime()
        );

        return bookingRepository.save(existing);
    }

    @Override
    public void cancel(Long id) {

        Booking booking = getById(id);

        if (booking.getStatus() == BookingStatus.COMPLETED) {

            throw new InvalidBookingException(
                    "Completed booking cannot be cancelled"
            );
        }

        booking.setStatus(BookingStatus.CANCELLED);

        bookingRepository.save(booking);
    }

    @Override
    public List<Booking> getBySlot(Long slotId) {

        if (!slotRepository.existsById(slotId)) {

            throw new ResourceNotFoundException(
                    "Slot not found with id: " + slotId
            );
        }

        return bookingRepository.findBySlotId(slotId);
    }

        @Override
        public List<Booking> getByUser(Long userId) {
                return bookingRepository.findByUserId(userId);
        }

    @Override
    public List<?> getAvailableSlots(
            Long lotId,
            LocalDateTime startTime,
            LocalDateTime endTime) {

        if (!startTime.isBefore(endTime)) {

            throw new InvalidBookingException(
                    "Start time must be before end time"
            );
        }

        List<Slot> activeSlots
                = slotRepository.findByParkingLotIdAndStatus(
                        lotId,
                        SlotStatus.ACTIVE
                );

        return activeSlots.stream()
                .filter(slot -> {

                    long conflicts
                            = bookingRepository.countOverlappingBookings(
                                                        slot.getId(),
                                                        startTime,
                                                        endTime,
                                                        List.of(
                                                                BookingStatus.RESERVED,
                                                                BookingStatus.CHECKED_IN
                                                        )
                                                );

                    return conflicts == 0;
                })
                .toList();
    }
}
