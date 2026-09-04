export const MATTER_REMEDIATION = {
  pm1: {
    0: { tag: 'dissolved-means-destroyed', hint: 'Nothing left the cup. If the sugar matter was not destroyed, where could its particles be after stirring?' },
    2: { tag: 'matter-becomes-energy', hint: 'Light is energy, not a destination for sugar matter. Look for a particle model that keeps the sugar present.' },
    3: { tag: 'dissolved-leaves-system', hint: 'The sugar did not leave the cup. Ask how particles can remain present even when you cannot see them.' }
  },
  pm2: {
    1: { tag: 'appearance-is-particle-evidence', hint: 'Balloon color comes from the balloon material. Which observation changes when air is added and directly measures matter?' },
    2: { tag: 'sound-is-particle-evidence', hint: 'A popping sound is not a direct measurement of matter. Look for measurable before-and-after evidence.' },
    3: { tag: 'shape-is-particle-evidence', hint: 'Shape alone does not show that added air has matter. Which choice measures a change caused by adding air?' }
  },
  pm3: {
    0: { tag: 'gas-particles-shrink', hint: 'When a gas is compressed, think about the empty space between particles before changing the particles themselves.' },
    2: { tag: 'particles-enter-sealed-system', hint: 'The syringe is sealed, so new particles cannot enter. What can change inside without adding matter?' },
    3: { tag: 'compression-causes-phase-change', hint: 'A small push on trapped air does not make it a solid. Focus on particle spacing.' }
  },
  mc1: {
    0: { tag: 'phase-change-destroys-matter', hint: 'Melting changes state, not whether matter exists. The bag is sealed, so track the total matter before and after.' },
    1: { tag: 'melting-halves-mass', hint: 'There is no rule that melting cuts mass in half. Ask whether any matter entered or left the sealed bag.' },
    3: { tag: 'melting-creates-matter', hint: 'A sealed bag gains no new matter during melting. Compare the system before and after the phase change.' }
  },
  mc2: {
    0: { tag: 'open-system-loss-means-destroyed', hint: 'A lower measured mass does not prove matter vanished. The cup is open and bubbles escaped. Where could that matter have gone?' },
    2: { tag: 'measurement-causes-mass-loss', hint: 'The balance reports the mass; it does not remove matter. Focus on what physically left the open system.' },
    3: { tag: 'gas-is-not-matter', hint: 'Bubbles are gas, and gas is matter. What happens to the measured mass when gas leaves an open cup?' }
  },
  mc3: {
    0: { tag: 'mixing-destroys-matter', hint: 'Use the two measured totals. Did the sealed system lose any measured mass?' },
    2: { tag: 'liquid-has-no-mass', hint: 'Liquids are matter and have mass. Use the total mass of the whole sealed system.' },
    3: { tag: 'component-mass-doubles', hint: 'The data report the total system mass, not a doubling of one material. Compare before with after.' }
  },
  mp1: {
    2: { tag: 'context-is-material-property', hint: 'A useful identifying property should stay with the material if you move it to another desk.' },
    3: { tag: 'test-date-is-material-property', hint: 'The date of testing does not belong to the material. Choose properties that can distinguish metal from plastic.' }
  },
  mp2: {
    1: { tag: 'uses-only-one-property', hint: 'Match both observations: dissolves in water and is not magnetic. One matching property is not enough.' },
    2: { tag: 'ignores-dissolving-evidence', hint: 'This sample matches the magnetic result but not the dissolving result. Use both columns.' },
    3: { tag: 'evidence-is-insufficient', hint: 'The table gives both tested properties for every sample. Try matching the unknown to both observations.' }
  },
  mp3: {
    1: { tag: 'all-substances-share-properties', hint: 'Substances can share one property without being the same substance. Why might several properties give stronger evidence?' },
    2: { tag: 'properties-change-when-measured', hint: 'Characteristic properties are useful because they can be measured consistently. Think about identification, not measurement changing the sample.' },
    3: { tag: 'single-property-is-enough', hint: 'Two different substances can share one property. What happens to confidence when several properties match?' }
  },
  ns1: {
    2: { tag: 'motion-means-new-substance', hint: 'Moving the cup changes location, not the substances. Look for evidence that a material with new properties appeared.' },
    3: { tag: 'stirring-alone-means-new-substance', hint: 'Stirring can mix materials without making a new substance. Which observations show something new formed?' }
  },
  ns2: {
    0: { tag: 'dissolving-means-new-substance', hint: 'If the original salt can be recovered unchanged after the water evaporates, what does that suggest about whether a new substance formed?' },
    2: { tag: 'dissolved-means-destroyed', hint: 'The salt can later be recovered. Matter that can be recovered was not destroyed.' },
    3: { tag: 'water-becomes-solute', hint: 'The water and salt can be separated again. Track each material instead of turning one into the other.' }
  },
  ns3: {
    1: { tag: 'shape-change-means-reaction', hint: 'Changing shape in a new container does not create a material with new properties. Look for evidence of a new substance.' },
    2: { tag: 'phase-change-means-new-substance', hint: 'Ice and liquid water are the same substance in different states. Which result shows a material with new properties forming?' },
    3: { tag: 'settling-means-reaction', hint: 'Settling can separate a mixture without creating a new substance. Look for a new material appearing.' }
  }
};
