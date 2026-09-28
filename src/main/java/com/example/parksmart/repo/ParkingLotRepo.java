package com.example.parksmart.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parksmart.model.ParkingLot;

public interface ParkingLotRepo extends JpaRepository<ParkingLot, Long>{

}
