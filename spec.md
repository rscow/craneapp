# Crane Operator

## Purpose
Run a tower crane with the keyboard. Pick up loads from the staging area and set them on a building under construction before time runs out, without tipping the crane.

## Inputs
- The arrow keys on the keyboard dictate the trolley on the load arm of the crane. Side arrows can extend or retract the trolley, and the vertical arrows can move the cable/hook up and down. The 'A' key turns the crane clockwise and the 'D' key turns it counterclockwise. 

## Calculations
- The arm has a minimum radius of 50 feet from the mast and a maximum of 150 feet from the mast. 
- There will be loads of different weights that the crane has to pick up and target locations to put them. 
- The crane must follow this load chart, which will also be shown on screen
Radius (ft)	Capacity (lb)
50	20,000
75	13,000
100	9,000
125	7,000
150	5,500
- Use the data in the load chart to interpolate the capacity at different radii 
- score is determined by how quickly weights can be taken to their target
 
## Outputs
- the crane needs to move in real time according to the player's inputs 
- A warning when the load reaches 90% of capacity at the current radius, and a dramatic tip-over when it passes 100%
- timer and a score 
- 

## Look and feel
- An 8-bit style with bright, semi-realistic colors 



## Validation
- Radius with maximum load and associated moment: 
100 ft --- 9000 lbs --- 900000 ft-lbs 
110 ft --- 8500 lbs --- 935000 ft-lbs 
90 ft --- 10750 lbs --- 967500 ft-lbs


## Out of scope
- no free play/practice
- crane customization 
