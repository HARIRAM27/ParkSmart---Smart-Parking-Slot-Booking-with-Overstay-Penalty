package com.example.parksmart.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.parksmart.Enums.SlotStatus;
import com.example.parksmart.exception.ResourceNotFoundException;
import com.example.parksmart.model.ParkingLot;
import com.example.parksmart.model.Slot;
import com.example.parksmart.repo.ParkingLotRepo;
import com.example.parksmart.repo.SlotRepo;

@Service
public class SlotServiceImpl implements SlotService {

    private final SlotRepo slotRepository;
    private final ParkingLotRepo parkingLotRepository;

    public SlotServiceImpl(
            SlotRepo slotRepository,
            ParkingLotRepo parkingLotRepository) {

        this.slotRepository = slotRepository;
        this.parkingLotRepository = parkingLotRepository;
    }

    @Override
    public Slot create(Slot slot) {

        Long lotId = slot.getParkingLot().getId();

        ParkingLot lot = parkingLotRepository.findById(lotId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Parking lot not found with id: " + lotId
                        ));

        slot.setParkingLot(lot);

        if (slot.getStatus() == null) {
            slot.setStatus(SlotStatus.ACTIVE);
        }

        return slotRepository.save(slot);
    }

    @Override
    public List<Slot> getAll() {
        return slotRepository.findAll();
    }

    @Override
    public Slot getById(Long id) {

        return slotRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Slot not found with id: " + id
                        ));
    }

    @Override
    public Slot update(Long id, Slot slot) {

        Slot existing = getById(id);

        existing.setSlotNumber(slot.getSlotNumber());
        existing.setSlotType(slot.getSlotType());
        existing.setStatus(slot.getStatus());

        if (slot.getParkingLot() != null &&
                slot.getParkingLot().getId() != null) {

            ParkingLot lot =
                    parkingLotRepository.findById(
                            slot.getParkingLot().getId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Parking lot not found"
                            ));

            existing.setParkingLot(lot);
        }

        return slotRepository.save(existing);
    }

    @Override
    public void delete(Long id) {

        Slot slot = getById(id);

        slotRepository.delete(slot);
    }

    @Override
    public List<Slot> getActiveSlotsByLot(Long lotId) {

        if (!parkingLotRepository.existsById(lotId)) {
            throw new ResourceNotFoundException(
                    "Parking lot not found with id: " + lotId
            );
        }

        return slotRepository.findByParkingLotIdAndStatus(
                lotId,
                SlotStatus.ACTIVE
        );
    }
}