'use strict';

// Compatibility and calibration layer for the v1.9 clinical-validation rules.
// Emergency PGE initiation bundles monitored vascular access rather than
// delaying ductal support. The standalone order remains available afterward
// for explicit documentation and rubric credit.

const phsRc2PlaceOrder = placeOrder;
placeOrder = function placeOrderClinicalValidationRc3(orderId) {
  let bundledAccess = null;
  if (state.selectedId === 'maya' && orderId === 'pge' && !phsCompleted('maya', 'monitoriv')) {
    const patient = state.patients.maya;
    const template = patient.orders.find(order => order.id === 'monitoriv');
    bundledAccess = { ...clone(template), placedAt: state.time, status: 'available', availableAt: state.time, autoBundled: true };
    patient.ordersPlaced.push(bundledAccess);
    for (const effect of template.effects || []) patient.flags[effect.flag] = effect.value;
    patient.flags.vascularAccess = true;
    addTimeline('Monitored vascular access was bundled with emergency prostaglandin initiation.', 'maya', 'safety');
  }
  const outcome = phsRc2PlaceOrder(orderId);
  if (bundledAccess) {
    state.patients.maya.ordersPlaced = state.patients.maya.ordersPlaced.filter(order => order !== bundledAccess);
    renderAll();
  }
  return outcome;
};

const phsRc2ApplyEffects = applyEffects;
applyEffects = function applyEffectsClinicalValidationRc3(patientId, order) {
  const authoredApnea = patientId === 'maya' && order.id === 'pge' &&
    (state.flags.forcePgeApnea || state.variant.id === 'C');
  phsRc2ApplyEffects(patientId, order);
  if (patientId === 'maya' && order.id === 'pge' && !authoredApnea) {
    state.processes = state.processes.filter(process => !(process.kind === 'special' && process.special === 'pge-apnea-clinical'));
    addTimeline('No prostaglandin-associated apnea occurred in this authored variant; respiratory readiness remains required.', 'maya', 'safety');
  }
};

const clinicalValidationBadge = document.querySelector('.version');
if (clinicalValidationBadge) clinicalValidationBadge.textContent = 'CLINICAL VALIDATION v1.9 RC3';
document.title = 'PHS - Clinical Validation v1.9 RC3';
