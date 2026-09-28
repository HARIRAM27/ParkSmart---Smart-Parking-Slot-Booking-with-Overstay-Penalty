package com.example.parksmart.service;

import com.example.parksmart.model.CheckInOut;

import java.util.List;

public interface CheckInOutService {

    CheckInOut checkIn(Long bookingId);

    CheckInOut checkOut(Long bookingId);

    CheckInOut getByBookingId(Long bookingId);

    List<CheckInOut> getAll();

    long getCurrentOccupancy(Long lotId);
}