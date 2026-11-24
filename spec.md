# Crane Operator

## Purpose
Run a tower crane with the keyboard. Pick up loads from the staging area and deliver them to target locations on a building under construction before time runs out, earning points without tipping the crane.

## Gameplay
- The player repeatedly picks up a load, moves it to its target location, and sets it down.
- Press the spacebar to attach a load only when the hook is inside the small rectangle on top of the load.
- Press the spacebar to detach the load at any time.
- A load is delivered successfully when it is detached over the matching target and the bottom of the load is aligned with the top of the target, with a small margin of error.
- An unsuccessful drop restores the load to its original position on the staging platform.
- Dropping a load incorrectly resets the consecutive-delivery multiplier.
- The game ends if the crane tips over.

## Inputs
- The horizontal arrow keys extend or retract the trolley on the load arm.
- The vertical arrow keys move the crane cable and hook up and down.
- The spacebar attaches or detaches a load.

## Calculations
- The arm has a minimum radius of 50 feet from the mast and a maximum of 150 feet from the mast.
- Loads have different weights and each load has a target location.
- The crane must follow this load chart, which will also be shown on screen

Radius (ft)	Capacity (lb)
50	20,000
75	13,000
100	9,000
125	7,000
150	5,500
- Use the data in the load chart to interpolate the capacity at different radii.
- Trying to lift a load whose weight exceeds the crane's capacity at the current radius tips the crane and ends the game.
- Score depends on delivery time and load weight.
- Successful consecutive deliveries increase the score with a multiplier.
 
## Outputs
- The crane needs to move in real time according to the player's inputs.
- A warning should appear when the load reaches 90% of capacity at the current radius.
- A dramatic tip-over should appear when the crane exceeds its capacity.
- Timer and score should be shown on screen.

## Look and feel
- An 8-bit style with bright, semi-realistic colors 



## Validation
- 100 ft radius: 9,000 lb capacity
- 110 ft radius: 8,200 lb interpolated capacity
- 90 ft radius: 10,750 lb interpolated capacity


## Out of scope
- no free play/practice
- crane customization 
