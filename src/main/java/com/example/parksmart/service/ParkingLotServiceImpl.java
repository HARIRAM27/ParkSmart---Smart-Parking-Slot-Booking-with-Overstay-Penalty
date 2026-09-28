package com.example.parksmart.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.parksmart.exception.ResourceNotFoundException;
import com.example.parksmart.model.ParkingLot;
import com.example.parksmart.repo.ParkingLotRepo;

@Service
public class ParkingLotServiceImpl implements ParkingLotService {

    private final ParkingLotRepo repository;

    public ParkingLotServiceImpl(
            ParkingLotRepo repository) {

        this.repository = repository;
    }

    @Override
    public ParkingLot create(ParkingLot parkingLot) {
        return repository.save(parkingLot);
    }

    @Override
    public List<ParkingLot> getAll() {
        return repository.findAll();
    }

    @Override
    public ParkingLot getById(Long id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Parking lot not found with id: " + id
                        ));
    }

    @Override
    public ParkingLot update(
            Long id,
            ParkingLot parkingLot) {

        ParkingLot existing = getById(id);

        existing.setLotName(parkingLot.getLotName());
        existing.setLocation(parkingLot.getLocation());
        existing.setTotalSlots(parkingLot.getTotalSlots());
        existing.setPenaltyRate(parkingLot.getPenaltyRate());
        existing.setPenaltyUnitMinutes(
                parkingLot.getPenaltyUnitMinutes()
        );

        return repository.save(existing);
    }

    @Override
    public void delete(Long id) {

        ParkingLot existing = getById(id);

        repository.delete(existing);
    }
}