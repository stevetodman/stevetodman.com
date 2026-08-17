# Unreal Content folder map

Create under `cardiohospital-unreal/Content/`:

```
Content/
┌── Data/                          # clinical-content.json only (existing)
┌── Maps/
│   └── OutpatientClinic_VSlice
┌── Environments/
│   ┌── TeamRoom/
│   │   ┌── SM_ConferenceTable
│   │   ┌── SM_Workstation
│   │   ┌── SM_OfficeChair
│   │   ┌── SM_WallEcgDisplay
│   │   └── Materials/
│   └── ExamRoom3/
│       ┌── SM_ExamTable
│       ┌── SM_Stool
│       ┌── SM_VitalMonitor
│       └── Materials/
┌── Characters/
│   ┌── MH_DrPatel/
│   ┌── MH_MarcusChen/
│   └── MH_Parent/
┌── Blueprints/
│   ┌── Actors/                    # presentation adapters only
│   └── UI/
┌── Audio/
│   ┌── VO/
│   └── Spatial/
└── VFX/
```

**Rules:** Clinical truth only via `UCardioClinicalDataSubsystem`. World actors call `StartCase` / `GetAvailableActions` / `PerformAction`. No clinical branching in environment Blueprints.
