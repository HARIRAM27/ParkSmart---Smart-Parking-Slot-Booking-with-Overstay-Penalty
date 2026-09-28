package com.example.parksmart.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.parksmart.Enums.SlotStatus;
import com.example.parksmart.model.Slot;

public interface SlotRepo
        extends JpaRepository<Slot, Long> {

    List<Slot> findByParkingLotIdAndStatus(
            Long parkingLotId,
            SlotStatus status
    );
}