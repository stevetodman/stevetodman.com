'use strict';

// Compatibility and calibration layer for the v1.9 clinical-validation rules.
// Emergency PGE initiation bundles monitored vascular access rather than
// delaying ductal support. Prostaglandin-associated apnea is an authored event
// in variant C; regression plans may force it explicitly.

const phsRc2PlaceOrder = placeOrder;
placeOrder = function placeOrderClinicalValidationRc3(orderId) {
  if (state.selectedId === 'maya' && orderId === 'pge' && !phsCompleted('maya', 'monitoriv')) {
    if (!orderRecord('maya', 'monitoriv')) phsRc2PlaceOrder('monitoriv');
    const access = orderRecord('maya', 'monitoriv');
    if (access?.status === 'pending') {
      state.processes = state.processes.filter(process => !(process.kind === 'order' && process.patientId === 'maya' && process.orderId === 'monitoriv'));
      completeOrder('maya', 'monitoriv');
    }
    addTimeline('Monitored vascular access was bundled with emergency prostaglandin initiation.', 'maya', 'safety');
  }
  return phsRc2PlaceOrder(orderId);
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
