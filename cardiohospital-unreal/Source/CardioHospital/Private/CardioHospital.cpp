#include "CardioHospital.h"
#include "CardioClinicPolish.h"
#include "CardioEncounterPresentationNPC.h"
#include "Modules/ModuleManager.h"

DEFINE_LOG_CATEGORY(LogCardioHospital);

class FCardioHospitalModule final : public FDefaultGameModuleImpl
{
public:
    virtual void StartupModule() override
    {
        FDefaultGameModuleImpl::StartupModule();
        CardioClinicPolish::RegisterWorldHook();
        CardioEncounterPresentation::RegisterWorldHook();
    }

    virtual void ShutdownModule() override
    {
        CardioEncounterPresentation::UnregisterWorldHook();
        CardioClinicPolish::UnregisterWorldHook();
        FDefaultGameModuleImpl::ShutdownModule();
    }
};

IMPLEMENT_PRIMARY_GAME_MODULE(FCardioHospitalModule, CardioHospital, "CardioHospital");
