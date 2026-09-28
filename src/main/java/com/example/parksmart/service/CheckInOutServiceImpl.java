package com.example.parksmart.service;

import com.example.parksmart.Enums.BookingStatus;
import com.example.parksmart.exception.InvalidBookingException;
import com.example.parksmart.exception.ResourceNotFoundException;
import com.example.parksmart.model.Booking;
import com.example.parksmart.model.CheckInOut;
import com.example.parksmart.repo.BookingRepo;
import com.example.parksmart.repo.CheckInOutRepo;
import com.example.parksmart.service.CheckInOutService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import com.example.parksmart.repo.BookingRepo;
import com.example.parksmart.repo.CheckInOutRepo;

@Service
public class CheckInOutServiceImpl
        implements CheckInOutService {

    private final BookingRepo bookingRepository;
    private final CheckInOutRepo checkInOutRepository;

    public CheckInOutServiceImpl(
            BookingRepo bookingRepository,
            CheckInOutRepo checkInOutRepository) {

        this.bookingRepository = bookingRepository;
        this.checkInOutRepository = checkInOutRepository;
    }

    @Override
    @Transactional
    public CheckInOut checkIn(Long bookingId) {

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Booking not found with id: "
                                        + bookingId
                                ));

        if (booking.getStatus() !=
                BookingStatus.RESERVED) {

            throw new InvalidBookingException(
                    "Only RESERVED bookings can be checked in"
            );
        }

        if (checkInOutRepository
                .findByBookingId(bookingId)
                .isPresent()) {

            throw new InvalidBookingException(
                    "Vehicle has already been checked in"
            );
        }

        CheckInOut record = new CheckInOut();

        record.setBooking(booking);
        record.setCheckInTime(LocalDateTime.now());
        record.setOverstayMinutes(0L);
        record.setPenaltyAmount(BigDecimal.ZERO);

        booking.setStatus(BookingStatus.CHECKED_IN);

        bookingRepository.save(booking);

        return checkInOutRepository.save(record);
    }

    @Override
    @Transactional
    public CheckInOut checkOut(Long bookingId) {

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Booking not found with id: "
                                        + bookingId
                                ));

        CheckInOut record =
                checkInOutRepository
                        .findByBookingId(bookingId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Check-in record not found"
                                ));

        if (record.getCheckOutTime() != null) {

            throw new InvalidBookingException(
                    "Vehicle has already been checked out"
            );
        }

        LocalDateTime checkout = LocalDateTime.now();

        record.setCheckOutTime(checkout);

        long overstayMinutes = 0;

        if (checkout.isAfter(booking.getEndTime())) {

            overstayMinutes =
                    Duration.between(
                            booking.getEndTime(),
                            checkout
                    ).toMinutes();
        }

        BigDecimal penalty = calculatePenalty(
                overstayMinutes,
                booking.getSlot()
                        .getParkingLot()
                        .getPenaltyRate(),
                booking.getSlot()
                        .getParkingLot()
                        .getPenaltyUnitMinutes()
        );

        record.setOverstayMinutes(overstayMinutes);
        record.setPenaltyAmount(penalty);

        booking.setStatus(BookingStatus.COMPLETED);

        bookingRepository.save(booking);

        return checkInOutRepository.save(record);
    }

    private BigDecimal calculatePenalty(
            long overstayMinutes,
            Double rate,
            Integer unitMinutes) {

        if (overstayMinutes <= 0) {
            return BigDecimal.ZERO;
        }

        long units =
                (long) Math.ceil(
                        (double) overstayMinutes /
                        unitMinutes
                );

        return BigDecimal.valueOf(rate)
                .multiply(BigDecimal.valueOf(units))
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public CheckInOut getByBookingId(
            Long bookingId) {

        return checkInOutRepository
                .findByBookingId(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Check-in/out record not found"
                        ));
    }

    @Override
    public List<CheckInOut> getAll() {
        return checkInOutRepository.findAll();
    }

    @Override
    public long getCurrentOccupancy(Long lotId) {

        return checkInOutRepository
                .countByBookingSlotParkingLotIdAndCheckOutTimeIsNull(
                        lotId
                );
    }
}