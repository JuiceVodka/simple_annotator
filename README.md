# Simple annotator

This project is a simple tool for annotating music sheets. Its aim is to make annotatins faster and simpler to provide more data for better OMR models.

## Usage

### Staff annotation
Annotation is divided into 4 stages. The first stage is staff selection. During this stage, the user can select a staff, by clicking and draging from its top left corner to its bottom right corner. After that, the staffs clef, sharps, flats and time should be put into their respective fields.\
\
<img src="https://github.com/user-attachments/assets/76c9a4e6-44c7-4d02-ba6d-1f2a8e9e35af" alt="drawing" width="500"/>

### Note annotation
The next stage is note annotation. THe user can annotate nots by simply clicking in them. A note suggestion is created automatically based on the clef of the staff. Any sharps and flats should be put in manualy. The time of the note is written as the bottom part of its fraction. Per example, a quarter note would have time 4 and an eight note would have time 8.\
\
<img src="https://github.com/user-attachments/assets/4f78e6a0-8338-40a1-847f-102ff06179df" alt="drawing" width="500"/>

### Rest annotation
Next, the user can annotate rests. Rests are annotated by clicking on them and providing their duration. The duration is, as with notes, provided as the bottom part of the fraction.\
\
<img src="https://github.com/user-attachments/assets/e31a511f-d176-4513-8c69-b29a8f1ff95a" alt="drawing" width="500"/>

### Barline annotation
Lastly, barlines are annotated by simply clicking on them.\
\
<img src="https://github.com/user-attachments/assets/1b888d34-13e9-4b53-a40a-0f86ba8084e3" alt="drawing" width="500"/>

After annotating all the barlines and clicking done, the annotated staff gets recieves a green outline, marking it as annotated. The user can now move on to the next staff. After all the staffs on the page are annotated, the user can save the annotation by clicking the save button, which dowloads the annotation as a json file.
