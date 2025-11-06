CLARIFICATION QUESTIONS
1. Project Scope & Structure
•	Should this be one integrated web app with multiple sections, or separate web apps for each gamma-ray source type?
-	separate web apps for each gamma-ray source type

•	Do you want to keep the current generic app and add the new functionality, or create a completely new application?
-	 a completely new application
•	Should there be a navigation menu to access different sections (educational content, simulators, quiz game)?
             -   yes
2. Educational Content Sections
You mentioned 5 sections for the sources. Should these include:
•	Text descriptions of each source type?                                          yes
•	The comparison tables with Hillas parameters?                      yes
•	The ASCII/visual representations of expected traces?          yes
•	Information about Cherenkov telescopes and detection methods?      yes
•	Should this be integrated in the same HTML file or separate pages?   separate pages
3. Source-Specific Simulations
For each of the 5 gamma-ray sources, should we create:
•	Dedicated simulation modes where tracks match the specific characteristics (length, width, size, alpha)?      yes
•	Should users be able to switch between source types to see different characteristic tracks?
yes
•	Do you want all 5 source types in one app or individual apps?  Individual app
4. Track Generation Parameters
Based on your specifications, I need to confirm the parameter ranges for each source:
Crab Nebula (PWN):
•	Length: 0.2-0.3° (currently ~20-35px, should we scale?)
•	Width: 0.05-0.1°
•	Size: Very high (1000 units)
•	Alpha: ~0°
•	Visual: Compact, bright core (red-orange), yellow-green halo
•	Energy range: Up to 80 TeV
Supernova Remnants/PeVatrons:
•	Length: 0.3-0.5° (longer tracks)
•	Width: 0.1-0.2°
•	Size: Enormous (2000 units, may saturate)
•	Alpha: Variable
•	Visual: Extended, white/red saturated core, yellow-green tails
•	Energy: Up to hundreds of TeV/PeV
AGN/Blazars:
•	Length: 0.1-0.2° (small, point-like)
•	Width: 0.05° (very compact)
•	Size: 1200 units (concentrated)
•	Alpha: ~0°
•	Visual: Compact point-source, minimal halo
•	Energy: Up to few TeV
GRBs:
•	Length: 0.1-0.2°
•	Width: 0.05-0.1°
•	Size: 1500 units (very bright in single events)
•	Alpha: ~0°
•	Visual: Small, intense, isolated in time
•	Energy: Extremely intense but brief
Galactic Center:
•	Length: 0.2-0.4° (variable)
•	Width: 0.1-0.2° (variable)
•	Size: 1800 units (distributed)
•	Alpha: ~10° (not point-like)
•	Visual: Multiple regions, complex, irregular
•	Energy: Up to tens of TeV
I confirm the parameter ranges for each source 
Should I translate these angular measurements to pixel values? What conversion should I use (e.g., 1° = X pixels)?
yes
5. Visual Representation (Color Maps)
You mentioned color-coded intensity maps:
•	Blue → weak signal / moderate energy
•	Green-Yellow → intermediate signal
•	Orange-Red → very intense / high energy
•	White → saturation (extremely energetic)
Should I:
•	Implement this color scheme instead of the current purple→blue→green→yellow palette?
yes
•	Apply it to camera images and/or detail viewers?
Yes, both
•	Keep hexagonal rendering or use regular pixel rendering for better color gradients?
use regular pixel rendering for better color gradients
6. Quiz/Game Functionality
For the educational game where users guess the source:
•	Should it generate one random source at a time and show all 7 windows (3 cameras + 3 viewers + stereo)?
-	yes
•	Should it display the Hillas parameters immediately or only after guessing?
-	immediately
•	What feedback should appear? Just "Correct/Incorrect" or educational explanation?
-	educational explanation
•	Should there be a score tracking system?
-	yes
•	Multiple choice (select from 5 sources) or open text input?
-	 Multiple choice (select from 5 sources)
•	Should there be difficulty levels (easy: very clear examples, hard: edge cases)?
-	No
•	Time limit for guessing?
- Yes
7. Stereoscopic Reconstruction
•	Should the final stereoscopic image show computed Hillas parameters on-screen?
-	yes
•	Display them as text overlay or in a separate info panel?
-	in a separate info panel
•	Which parameters to show: Length, Width, Size, Alpha, or all Hillas parameters?
- Length, Width, Size, Alpha
8. Inter-Camera Differences
You want 3 telescopes with stereoscopic view. Should:
•	Each camera show slightly different perspectives (parallax) like the current app?
-	yes
•	The differences be source-specific (e.g., PeVatrons show more variation, blazars less)?
-	yes
•	Maintain the current level of inter-camera variance or adjust it?
- Maintain the current level of inter-camera
9. Additional Features
Should the app include:
•	Educational tooltips explaining what each parameter means?
-	yes
•	Comparison mode to see all 5 sources side-by-side?
•	Export/save results or screenshots?
•	Progressive hints if user guesses incorrectly?
-	yes
•	Statistics page showing which sources are most commonly confused?
       -  yes
10. Technical Details
•	Should I keep the current resolution (1500×1000 for cameras)?  
-	yes
•	Maintain the current UI style (dark theme, same layout)?   
-	yes
•	Italian or English interface? (I see the spec is in Italian): 
-	Italian
•	Should the current debugging features (console logs, run counter) be removed for the final version? I don’t know what is better. Can you decide for me?
11. Implementation Priority
Development order:
1.	First create educational content pages
2.	add the source-specific simulator after every single educational page explaining a type of source
3.	Then add the quiz/game functionality?
12. Hadronic Background
•	Should the app also simulate hadronic (proton) cosmic ray events for comparison?  
-	yes
•	Show how gamma rays differ from cosmic ray showers (wider, less compact)?               
-	 yes

