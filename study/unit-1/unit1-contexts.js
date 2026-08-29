(function(){
  'use strict';

  // Practice contexts only. The teacher handout remains the canonical source for
  // definitions, synonyms, antonyms, spelling, and parts of speech.
  var SENTENCES={
    blunder:[
      'Leaving the freezer open overnight was a costly __________.',
      'Writing the wrong date on every invitation was quite a __________.',
      'The goalkeeper called the missed pass a careless __________.',
      'Forgetting the tent poles was our biggest camping __________.',
      'Mixing salt into the cake instead of sugar was a kitchen __________.'
    ],
    cancel:[
      'Lightning forced the coach to __________ the outdoor practice.',
      'The clerk will __________ the stamp so it cannot be used again.',
      'Heavy snow may __________ tomorrow’s field trip.',
      'Draw one line through the incorrect number to __________ it.',
      'The theater had to __________ the show when the power failed.'
    ],
    continuous:[
      'The __________ buzzing did not stop once all afternoon.',
      'A __________ line of ants stretched from the window to the pantry.',
      'The alarm made a __________ sound with no breaks between beeps.',
      'After three days of __________ rain, the creek covered the path.',
      'The machine needs a __________ flow of water without interruption.'
    ],
    distribute:[
      'Please __________ one worksheet to every student in the room.',
      'The volunteers will __________ food equally among the families.',
      'Maya helped __________ the flyers throughout the neighborhood.',
      'The dealer will __________ seven cards to each player.',
      'At lunch, the teacher asked us to __________ the supplies among the tables.'
    ],
    document:[
      'The signed __________ proves that the bicycle belongs to Lena.',
      'Use photographs to __________ each stage of the science experiment.',
      'The historian protected the old __________ inside a glass case.',
      'The nurse will __________ the temperature on the patient’s chart.',
      'This printed __________ contains the official rules of the contest.'
    ],
    fragile:[
      'The glass ornament is __________, so carry it with both hands.',
      'A __________ shell can crack under very little pressure.',
      'The package marked HANDLE WITH CARE contains something __________.',
      'That thin clay bowl is too __________ for the dishwasher.',
      'We wrapped the __________ model in soft cloth so it would not break.'
    ],
    myth:[
      'The claim that the moon is made of cheese is a __________, not a fact.',
      'The old __________ tells how a giant supposedly formed the mountains.',
      'Dad said the story about an alligator in the school pool was a __________.',
      'A tale about an imaginary winged horse can be a __________.',
      'The museum guide explained that the famous treasure story was only a __________.'
    ],
    reject:[
      'The judges will __________ any entry that breaks the rules.',
      'The shelter may __________ a torn blanket that cannot be used safely.',
      'If the evidence is unreliable, the scientist should __________ the claim.',
      'The editor will __________ an article that has no supporting facts.',
      'Because the form was incomplete, the office had to __________ it.'
    ],
    scuffle:[
      'A brief __________ over the last ball ended when the whistle blew.',
      'The two puppies had a playful __________ beside the water bowl.',
      'A noisy __________ in the hallway knocked over a stack of books.',
      'The referee stopped the __________ before anyone was hurt.',
      'Their small __________ lasted only seconds before they shook hands.'
    ],
    solitary:[
      'One __________ sailboat crossed the empty bay by itself.',
      'The __________ hiker ate lunch alone beside the trail.',
      'A __________ light glowed in the otherwise dark building.',
      'The owl was the __________ animal awake in the quiet barn.',
      'She chose a __________ seat far from every other passenger.'
    ],
    temporary:[
      'The __________ bridge will be removed when the permanent one opens.',
      'Our classroom in the library is only __________ during the repairs.',
      'The bandage is a __________ covering until the doctor examines the cut.',
      'This __________ password expires at the end of the day.',
      'The workers built a __________ fence that will come down next week.'
    ],
    veteran:[
      'The __________ firefighter had handled hundreds of emergencies.',
      'As a Navy __________, Grandpa is invited to march in the parade.',
      'The team trusted its __________ coach because she had decades of experience.',
      'A __________ reporter knew exactly which questions to ask.',
      'The __________ carpenter spotted the crooked board immediately.'
    ]
  };

  Object.keys(SENTENCES).forEach(function(word){
    SENTENCES[word]=SENTENCES[word].map(function(q,index){
      return {id:word+'-'+(index+1),q:q,a:word};
    });
  });

  var PARAGRAPHS=[
    {id:'ranger',title:'Canyon ranger · 12-for-12',text:'The {1} ranger had worked the canyon alone for years, a truly {2} job. Each morning she would {3} trail maps to hikers and warn them the rope bridge was {4}. One {5} was letting a group cross with heavy packs — the boards cracked. She had to {6} every tour for the rest of the week. A {7} went around that a bear had chewed the ropes, but she would {8} that idea flatly. She wrote a {9} describing the real cause, and the noise of the repair crew was {10} from dawn to dusk. Two chipmunks even had a {11} over a dropped nail. The new bridge, she said, was only {12} until the steel one arrived in spring.',key:['veteran','solitary','distribute','fragile','blunder','cancel','myth','reject','document','continuous','scuffle','temporary']},
    {id:'pilot',title:'Foggy flight · 12-for-12',text:'The {1} pilot did not {2} the flight, even though the fog was {3} all morning. Her one small {4} was leaving the coffee on the wing. A flight attendant began to {5} pretzels while a {6} passenger read alone in row 12. Two toddlers had a tiny {7} over a plastic cup. The captain signed a {8} saying the delay was only {9}. A rumor that the plane could fly upside down was a {10}, and the crew had to {11} that idea completely. The snack cart, sadly, was {12} and lost a wheel.',key:['veteran','cancel','continuous','blunder','distribute','solitary','scuffle','document','temporary','myth','reject','fragile']},
    {id:'dock',title:'Rainy picnic + dock · 12-for-12',text:'Ms. Dunn had to {1} the class picnic because the rain was {2} — it never stopped once from Monday to Friday. Her first {3} was forgetting to tell anyone, so twelve kids stood outside with sandwiches. To fix it, she asked Ravi to {4} a note to every student. She also wrote a {5} explaining the new date and taped it to the door. The tape was so {6} that the note fell off twice before lunch. Everyone believed the {7} that a three-eyed catfish lived under the dock. One {8} fisherman sat out there alone every morning to prove it. He was a {9} of forty summers on that lake, so nobody argued. When two boys started a {10} over the last worm, he made them shake hands. He told them to {11} any story they could not check themselves. The three-eyed catfish, he said, was only a {12} visitor.',key:['cancel','continuous','blunder','distribute','document','fragile','myth','solitary','veteran','scuffle','reject','temporary']},
    {id:'museum',title:'Museum opening · 12-for-12',text:'A {1} curator supervised the museum opening. She asked the guides to {2} maps and placed one {3} vase behind a guardrail. Her only {4} was hanging the dinosaur sign upside down. A {5} claimed the skeleton came from a dragon, but she would {6} that story and point to the scientific record. She used photographs to {7} every step of the restoration. Outside, the {8} rain forced her to {9} the courtyard tour. A {10} guard watched the empty west hall. When two visitors had a {11} over a seat, staff separated them. The closed exhibit was only {12}; it reopened the next morning.',key:['veteran','distribute','fragile','blunder','myth','reject','document','continuous','cancel','solitary','scuffle','temporary']},
    {id:'school-play',title:'School play · 12-for-12',text:'The {1} drama coach had directed plays for thirty years. She would {2} scripts while the cast listened to the {3} hum of the stage lights. A {4} actor practiced alone behind the curtain. Dropping the painted moon was a major {5} because its frame was {6}. The crew made a {7} with photographs to show how it broke. They had to {8} the first rehearsal, but the delay was only {9}. Two pirates had a harmless {10} over a foam sword. The rumor that a ghost lived backstage was a {11}, and the principal would {12} it whenever students repeated it.',key:['veteran','distribute','continuous','solitary','blunder','fragile','document','cancel','temporary','scuffle','myth','reject']},
    {id:'space-camp',title:'Space camp · 12-for-12',text:'A {1} engineer led the rocket challenge and began to {2} safety cards. The model capsule was {3}, so everyone handled it gently. One camper made a {4} by connecting the wires backward. The instructor used a checklist to {5} what happened. Because the warning tone became {6} and would not stop, she had to {7} the launch. A {8} camper remained at the table to repair the circuit. Two teammates started a {9} over who should hold the tools. The claim that astronauts can hear explosions in space was a {10}, and the engineer told them to {11} it. The delay was {12}; the rocket launched after lunch.',key:['veteran','distribute','fragile','blunder','document','continuous','cancel','solitary','scuffle','myth','reject','temporary']},
    {id:'harbor',title:'Harbor festival · 12-for-12',text:'A {1} about a sea monster spread through the harbor. The {2} harbor master knew every boat in the marina and would {3} that tale. At sunrise, volunteers began to {4} programs for the festival. A {5} glass trophy sat on the judges’ table, and leaving it near the edge was a careless {6}. The master wrote a {7} describing the accident. When the wind became {8} without a break, officials had to {9} the sailing race. One {10} gull stood alone on the empty pier. Two deckhands had a short {11} over a coil of rope. The indoor ceremony was a {12} replacement for the race.',key:['myth','veteran','reject','distribute','fragile','blunder','document','continuous','cancel','solitary','scuffle','temporary']},
    {id:'animal-clinic',title:'Animal clinic · 12-for-12',text:'The staff created a {1} to record every part of the clinic tour. A {2} veterinarian led the group, but {3} beeping from one monitor made her {4} the visit until it could be checked. She asked students to {5} care sheets and warned them that the bird eggs were {6}. Her assistant’s only {7} was putting the rabbit sign on the turtle cage. One {8} cat waited alone in the quiet room. Two puppies had a playful {9} over a toy. The claim that every bat is blind is a {10}, and the veterinarian told the class to {11} it. The noisy monitor received a {12} replacement battery.',key:['document','veteran','continuous','cancel','distribute','fragile','blunder','solitary','scuffle','myth','reject','temporary']},
    {id:'newsroom',title:'Snow-day newsroom · 12-for-12',text:'The {1} reporter arrived before dawn to cover the storm. Her editor told her to {2} updates to every desk. Outside, the {3} snowfall showed no sign of stopping. Forgetting to charge the camera was her first {4}. She used written notes to {5} each interview instead. Because the microphone was {6}, she carried it in a padded case. One {7} photographer waited alone by the courthouse. A small {8} broke out when two reporters reached for the same chair. The station had to {9} its outdoor broadcast and use a {10} studio inside. An online claim that school would remain closed all month was a {11}, and the editor would {12} it without evidence.',key:['veteran','distribute','continuous','blunder','document','fragile','solitary','scuffle','cancel','temporary','myth','reject']},
    {id:'castle',title:'Castle exhibit · 12-for-12',text:'The tale of a dragon beneath the floor was a {1}. A signed {2} proved who once owned the castle. The {3} guide would {4} the dragon story, then {5} maps of the rooms. He warned everyone that an ancient cup was {6}; touching it would be a serious {7}. A {8} tapping sound from the roof continued without a break, so workers had to {9} the tower visit. One {10} guard remained alone beside the staircase. Two students had a brief {11} over the last stool. The tower closure was only {12} while workers repaired the roof.',key:['myth','document','veteran','reject','distribute','fragile','blunder','continuous','cancel','solitary','scuffle','temporary']}
  ];

  window.WordExpeditionContexts={sentences:SENTENCES,paragraphs:PARAGRAPHS};
})();
