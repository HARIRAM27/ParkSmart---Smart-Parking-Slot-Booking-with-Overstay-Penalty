package com.example.parksmart.service;

import java.util.List;

import com.example.parksmart.model.ParkingLot;

public interface ParkingLotService {

    ParkingLot create(ParkingLot parkingLot);

    List<ParkingLot> getAll();

    ParkingLot getById(Long id);

    ParkingLot update(Long id, ParkingLot parkingLot);

    void delete(Long id);
}