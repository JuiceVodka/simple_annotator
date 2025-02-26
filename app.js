//for styling



//UI elements
const canvas = document.getElementById('clickCanvas');
const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');
const clearButton = document.getElementById('clear');
const saveButton = document.getElementById('save');
const nextButton = document.getElementById('next');
const prevButton = document.getElementById('prev');
const ctx = canvas.getContext('2d');
const clicksList = document.getElementById('clicksList');
const done_button = document.getElementById('done');
const post_button = document.getElementById('post');
const annotator_select = document.getElementById('annotator_group');
const navbuttons = document.getElementById('navbuttons');
const databuttons = document.getElementById('databuttons');
const stat = [document.getElementById('status1'), document.getElementById('status2'), document.getElementById('status3'), document.getElementById('status4')];

const confirmClear = document.getElementById('confirmClear');


const toneNums = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const toneNamesUp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const toneNamesDown = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

//other constants and storage variables
const annotator_groups = 10;
const first_page_static = 63;
const last_page_static = 181;
var first_page = 63; 
var last_page = 181;
var current_page = 63;
//todo tweak this

var page_overflow = 0;
var group = 0;

var staff = 0;
var annotatingStaff = true 

var initial_staff_click = [-1, -1];
var final_staff_click = [-1, -1];

var stage = 0;

const annotation_stages = ["Select staff", "Annotate notes", "Annotate rests", "Annotate barlines"];

// Array to store click coordinates
const clicks = [];

// Array to store click data
const clickData = [];

// Array to store click data by staff
const staffData = [];

// Array to store clicks that are undone
const undoneClicks = [];

const images_dir = "./images/";

const image = new Image();

window.onload = () => {
    image.src = images_dir + "page" + current_page + ".png";
    image.onload = function() {
        canvas.width = image.width;
        canvas.height = image.height;
        navbuttons.style.width = `${image.width}px`;
        databuttons.style.width = `${image.width}px`;
        ctx.drawImage(image, 0, 0);
    };

    //updateButtons();
    updateUi();

    updatePostButton();

}


async function checkBackendStatus() {
    try {
        const response = await fetch('http://localhost:3000/running');
        console.log(response);
        if (response.ok) {
            return true; // Backend is running
        }
    } catch (error) {
        console.error('Error checking backend status:', error);
    }
    return false; // Backend is not running
}

async function updatePostButton() {
    const backendRunning = await checkBackendStatus();
    post_button.disabled = !backendRunning;
    console.log('Backend running:', backendRunning);
}


function handleGroup(){
    group = annotator_select.groups.value
    if (group == "default"){
        console.log("Wrong option")
        return
    }
    let pageIntervals = ((last_page_static - first_page_static) / annotator_groups)*2 //its 24
    console.log("interval: ", pageIntervals)


    first_page = Math.round(first_page_static + (group - 1) * (pageIntervals/2))
    last_page = Math.round((first_page + pageIntervals)%(last_page_static+1))
    if (last_page < first_page_static){
        last_page += first_page_static
    }

    console.log("First page: ", first_page, "Last page: ", last_page)

    current_page = first_page

    clearCanvas()
    clearTextFields()
    image.src = images_dir + "page" + current_page + ".png";
    image.onload = function() {
        canvas.width = image.width;
        canvas.height = image.height;
        navbuttons.style.width = `${image.width}px`;
        databuttons.style.width = `${image.width}px`;
        ctx.drawImage(image, 0, 0);
        updateUi();
    };
}

// ----------------- Event Listeners -----------------



// Event listener for clicks on the canvas
canvas.addEventListener('click', (event) => {
    if (stage == 0) {
        return;
    } else if (stage == 1) { //annotating notes
        // clear the undo list
        undoneClicks.length = 0;

        //remove all the textboxes
        const inputContainers = document.querySelectorAll('.input-container');
        inputContainers.forEach(container => container.remove());

        // Get canvas bounding rectangle to calculate offsets
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let top_of_staff = staff.initial_staff_click[1]
        let bottom_of_staff = staff.final_staff_click[1]

        let tone_band_width = (bottom_of_staff - top_of_staff) / 8
        top_of_staff -= tone_band_width / 2
        bottom_of_staff += tone_band_width / 2

        

        //find in which band the click is
        let band = -1;
        for (let i = 0; i <= 8; i++){
            if (y >= top_of_staff + i * tone_band_width && y <= top_of_staff + (i+1) * tone_band_width){
                band = i;
                break;
            }
        }

        band = 8-band

        if(band < 0 || band > 8){
            //TODO handle notes above or bellow staff
            const bw = (bottom_of_staff - top_of_staff) / 6
            if(y < top_of_staff){ //above staff
                for (let i = 0; i < 6; i++){
                    if(y <= top_of_staff - i * bw && y > top_of_staff - (i+1) * bw){
                        band = 9 + i;
                        break;
                    }
                }
            } else { //bellow staff
                for(let i = 0; i < 6; i++){
                    if(y >= bottom_of_staff + i * bw && y < bottom_of_staff + (i+1) * bw){
                        band = -1 -i;
                        break;
                    }
                }

            }
        }

        console.log("Band: ", band)

        const base_tone = staff.clef == "TREBLE" ? 2 : 4
        const base_octave = staff.clef == "TREBLE" ? 4 : 2 //note on guitar it is written one octave higher

        const tones = ["C", "D", "E", "F", "G", "A", "B"]

        console.log((base_tone + band) % 7)
        console.log(base_octave + (band>=5) - (band <= -3), band>=5, band <= -3)
        console.log(base_octave + (band>=3) - (band <= -5))
        console.log(staff.clef == "TREBLE")

        const height = toneNums.indexOf(base_tone + band < 0 ? base_tone+band+7 : (base_tone + band) % 7)
        const octavenum = staff.clef == "TREBLE" ? base_octave + (band>=5) - (band <= -3) : base_octave + (band>=3) - (band <= -5)
        const tone = tones[base_tone + band < 0 ? base_tone+band+7 : (base_tone + band) % 7]
        const octave = staff.clef == "TREBLE" ? base_octave + (band>=5) - (band <= -3) : base_octave + (band>=3) - (band <= -5)

        //const recomendation = band<0 || band > 8 ? "" : `${tone}${octave}`
        const recomendation = `${tone}${octave}`
        console.log("Band: ", band, "Tone: ", tone, "Octave: ", octave, "Recomendation: ", recomendation)
        // check if the click is inside the staff box with margin
        if (x >= initial_staff_click[0] && x <= final_staff_click[0] && y >= initial_staff_click[1] - staff.margin_vertical && y <= final_staff_click[1] + staff.margin_vertical) {
            displayTextbox(x, y, recomendation, height, octavenum);
        }
    } else if (stage == 2) { // annoting rests
        // clear the undo list
        undoneClicks.length = 0;

        //remove all the textboxes
        const inputContainers = document.querySelectorAll('.input-container');
        inputContainers.forEach(container => container.remove());

        // Get canvas bounding rectangle to calculate offsets
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // check if the click is inside the staff box with margin
        if (x >= initial_staff_click[0] && x <= final_staff_click[0] && y >= initial_staff_click[1] - staff.margin_vertical && y <= final_staff_click[1] + staff.margin_vertical) {
            displayTextboxRest(x, y);
        }
    } else if (stage == 3) { // annoting barlines
        // clear the undo list
        undoneClicks.length = 0;

        //remove all the textboxes
        const inputContainers = document.querySelectorAll('.input-container');
        inputContainers.forEach(container => container.remove());

        // Get canvas bounding rectangle to calculate offsets
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // check if the click is inside the staff box with margin
        if (x >= initial_staff_click[0] && x <= final_staff_click[0] && y >= initial_staff_click[1] - staff.margin_vertical && y <= final_staff_click[1] + staff.margin_vertical) {
            //no textbox needed for barlines, display the barline and save the click
            clickData.push({ x, y });
            updateClicksList(x, y);
            //drawMarker(x, y);
            //updateButtons();
            updateUi();
        }
    
    }
});

// Event listener for click and drag on the canvas -> for staff annotation
canvas.addEventListener('mousedown', (event) => {
    if (stage != 0 || initial_staff_click[0] != -1) {
        return;
    }

    // Get canvas bounding rectangle to calculate offsets
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Save the initial click
    initial_staff_click = [x, y];
});

// Event listener for mouse up -> for staff annotation
canvas.addEventListener('mouseup', (event) => {
    if (stage != 0 || initial_staff_click[0] == -1 || final_staff_click[0] != -1) {
        return;
    }

    const x = event.clientX - canvas.getBoundingClientRect().left;
    const y = event.clientY - canvas.getBoundingClientRect().top;
    final_staff_click = [x, y];

    updateUi();

    inputStaffSpecifics()

});

//event listener for mouse move -> for staff annotation
canvas.addEventListener('mousemove', (event) => {
    if (stage != 0 || initial_staff_click[0] == -1) {
        return;
    }
    // Get canvas bounding rectangle to calculate offsets
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Clear the canvas
    clearCanvas();

    if (initial_staff_click[0] != -1 && final_staff_click[0] == -1) {
        // Draw a line from the initial click to the current mouse position
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(initial_staff_click[0], initial_staff_click[1]);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
});

// Event listener for undo button
undoButton.addEventListener('click', () => {
    if (clickData.length === 0) {
        return;
    }

    // Remove the last click from the array
    const lastClick = clickData.pop();

    // Add the click to the undone clicks array
    undoneClicks.push(lastClick);

    //updateButtons();
    updateUi();

    // Update the clicks list
    clicksList.removeChild(clicksList.lastElementChild);
});

// Event listener for redo button
redoButton.addEventListener('click', () => {
    if (undoneClicks.length === 0) {
        return;
    }

    // Get the last undone click
    const lastUndoneClick = undoneClicks.pop();

    // Add the click back to the array
    clickData.push(lastUndoneClick);

    //updateButtons();
    updateUi();

    // Update the clicks list
    updateClicksList(lastUndoneClick.x, lastUndoneClick.y);
});


confirmClear.addEventListener('click', () => {
    
    // Clear the clicks array
    clickData.length = 0;

    // Clear the undone clicks array
    undoneClicks.length = 0;

    updateUi();

    // Clear the clicks list
    clicksList.innerHTML = '';

    //clear any textboxes
    const inputContainers = document.querySelectorAll('[class$="input-container"]');
    inputContainers.forEach(container => container.remove());

    if (stage == 0){
        staff = 0;
        initial_staff_click = [-1, -1];
        final_staff_click = [-1, -1];
    }
});

nextButton.addEventListener('click', () => {
    clickData.length = 0;
    undoneClicks.length = 0;
    clicksList.innerHTML = '';

    if (group == 10 && current_page == last_page_static){
        current_page = first_page_static
    }else{
        current_page += 1;
    }


    image.src = images_dir + "page" + current_page + ".png";
    image.onload = function() {
        canvas.width = image.width;
        canvas.height = image.height;
        navbuttons.style.width = `${image.width}px`;
        databuttons.style.width = `${image.width}px`;
        ctx.drawImage(image, 0, 0);
        updateUi();
    };
    staff = 0;
    initial_staff_click = [-1, -1];
    final_staff_click = [-1, -1];
    staffData.length = 0;
    stage = 0;
});

prevButton.addEventListener('click', () => {
    clickData.length = 0;
    undoneClicks.length = 0;
    clicksList.innerHTML = '';

    if (group == 10 && current_page == first_page_static){
        current_page = last_page_static
    }else{
        current_page -= 1;
    }
    image.src = images_dir + "page" + current_page + ".png";
    image.onload = function() {
        canvas.width = image.width;
        canvas.height = image.height;
        navbuttons.style.width = `${image.width}px`;
        databuttons.style.width = `${image.width}px`;
        ctx.drawImage(image, 0, 0);
        updateUi();
    };
    staff = 0;
    initial_staff_click = [-1, -1];
    final_staff_click = [-1, -1];
    staffData.length = 0;
    stage = 0;
});

saveButton.addEventListener('click', () => {
    const data = JSON.stringify(staffData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page${current_page}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

done_button.addEventListener('click', () => {
    if (stage == 0){
        return;
    }else if (stage == 1){
        clickData.sort((a, b) => a.x - b.x);
        //save current tones under the current staff and clear the clickData array
        clickData.forEach(click => {
            staff.notes.push(click);
        });
 
        clickData.length = 0;
        undoneClicks.length = 0;
        clicksList.innerHTML = '';

        stage += 1;


    } else if (stage == 2){
        clickData.sort((a, b) => a.x - b.x);
        clickData.forEach(click => {
            staff.rests.push(click);
        });
        clickData.length = 0;
        undoneClicks.length = 0;
        clicksList.innerHTML = '';
        stage += 1;

    } else if (stage == 3){
        clickData.sort((a, b) => a.x - b.x);
        clickData.forEach(click => {
            staff.barlines.push(click.x);
        });
        clickData.length = 0;
        undoneClicks.length = 0;
        clicksList.innerHTML = '';
        stage = 0;
        staffData.push(staff);
        staff = 0;
        initial_staff_click = [-1, -1];
        final_staff_click = [-1, -1];

        console.log(staffData);
        console.log("Staff data saved")
        console.log(staffData);
    }
    updateUi();

});

post_button.addEventListener('click', async () => {
    const data = JSON.stringify(staffData, null, 2);
    const response = await fetch("http://localhost:3000/annotate-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data
    });

    const result = await response.json();
    console.log(result);
    if (result.success) {
        alert(`Saved data for ${current_page}`)
    }else {
        console.error("Error saving: ", result.error);
    }
});
//----------------- End of event listeners -----------------


// ----------------- Functions -----------------
function inputStaffSpecifics(){
    const container = document.createElement('div');
    container.className = "staff-input-container";
    container.style.position = 'absolute';
    container.style.border = '1px solid #000';
    container.style.backgroundColor = '#fff';
    container.style.left = `${canvas.width / 2}px`;
    container.style.top = `${canvas.height / 2}px`;
    container.style.padding = '10px';
    container.style.paddingTop = '0px';

    // Add a shared class to normalize input heights
    const normalizeHeight = "form-control text-start w-auto custom-input"; 

    const instruction = document.createElement('div');
    instruction.textContent = 'Enter the clef of the staff (treble, bass, alto, etc):';
    instruction.className = 'mt-2';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = normalizeHeight;  // ✅ Consistent class

    const instruction2 = document.createElement('div');
    instruction2.textContent = 'Enter the sharps and flats of the staff (e.g. F#, C#, Bb, etc):';
    instruction2.className = 'mt-2';

    const input2 = document.createElement('input');
    input2.type = 'text';
    input2.className = normalizeHeight;  // ✅ Consistent class

    const instruction3 = document.createElement('div');
    instruction3.textContent = 'Enter the time signature of the staff (e.g. 4/4, 3/4, 6/8, etc):';
    instruction3.className = 'mt-2';

    const input3 = document.createElement('input');
    input3.type = 'text';
    input3.className = normalizeHeight;  // ✅ Consistent class

    const buttongroup = document.createElement('div');
    buttongroup.className = "d-flex gap-2 mt-2"; 

    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-outline-secondary';
    submitButton.textContent = 'Ok';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-outline-secondary';
    cancelButton.textContent = 'Cancel';

    container.appendChild(instruction);
    container.appendChild(input);
    container.appendChild(instruction2);
    container.appendChild(input2);
    container.appendChild(instruction3);

    buttongroup.appendChild(input3);
    buttongroup.appendChild(submitButton);
    buttongroup.appendChild(cancelButton);
    container.appendChild(buttongroup);

    document.body.appendChild(container);

    input.focus();

    submitButton.addEventListener('click', () => saveStaffSpecifics(container, input.value.toUpperCase(), input2.value.toUpperCase(), input3.value.toUpperCase()));

    cancelButton.addEventListener('click', () => {
        container.remove();
        stage = 0
        staff = 0;
        initial_staff_click = [-1, -1];
        final_staff_click = [-1, -1];
        updateUi();
    });

    // Handle submission via Enter key
    input3.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            saveStaffSpecifics(container, input.value.toUpperCase(), input2.value.toUpperCase(), input3.value.toUpperCase());
        }
    });
}

function saveStaffSpecifics(container, clef, key, time){ 
    const re1 = /^(TREBLE|BASS|ALTO|TENOR|SOPRANO)$/
    const re2 = /^(([A-G](#|B))|[A-G](#|B)(, [A-G](#|B)){0,7})?$/
    const re3 = /^([0-9]\/[0-9])?$/

    //console.log(clef.trim().toUpperCase(), key.trim(), time.trim());
    //console.log(re1.test(clef.trim()), re2.test(key.trim()), re3.test(time.trim()));

    // Validate and save the input values
    if (re1.test(clef.trim()) && re2.test(key.trim()) && re3.test(time.trim())) {
        margin_vertical = Math.abs(initial_staff_click[1] - final_staff_click[1]);

        staff = {current_page, initial_staff_click, margin_vertical, final_staff_click, clef, key, time, notes: [], rests: [], barlines: []};
        console.log(staff);
        container.remove();
        console.log("Container removed")
        stage = 1;

        updateUi();

    } else {
        alert('Please enter valid values in the fields');
        console.log(clef.trim(), key.trim(), time.trim());
    }

}

//for note annotation
function displayTextbox(x, y, recomendation, tone, octave) {
    // Create a div container dynamically
    const container = document.createElement('div');
    container.className = 'input-container';
    container.style.left = `${x + canvas.offsetLeft}px`;
    container.style.top = `${y + canvas.offsetTop}px`;
    container.style.position = 'absolute';
    container.style.border = '1px solid #000';
    container.style.backgroundColor = '#fff';
    container.style.padding = '10px';
    container.style.paddingTop = '0px';

    // Common class for styling inputs
    const inputClass = "form-control text-start w-auto custom-input"; 

    // Create instructions and input fields
    const instruction1 = document.createElement('div');
    instruction1.setAttribute('style', 'white-space: pre;');
    instruction1.textContent = 'Enter the tone height (B4, C#2, etc):\r\n';
    instruction1.textContent += 'Use the up and down arrows to change the tone';
    instruction1.className = 'mt-2';

    const input1 = document.createElement('input');
    input1.type = 'text';
    input1.value = recomendation;
    input1.className = inputClass; // Apply consistent styling

    const instruction2 = document.createElement('div');
    instruction2.textContent = 'Enter the tone duration (1, 4, 8, 16 etc):';
    instruction2.className = 'mt-2';

    const input2Group = document.createElement('div'); // Wrapper for input & button
    input2Group.className = "d-flex gap-2 align-items-center"; // Aligns input & button

    const input2 = document.createElement('input');
    input2.type = 'text';
    input2.className = inputClass; // Apply consistent styling

    // Create a submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Ok';
    submitButton.className = 'btn btn-outline-secondary';

    // Append input and button inline
    input2Group.appendChild(input2);
    input2Group.appendChild(submitButton);

    // Append elements to the container
    container.appendChild(instruction1);
    container.appendChild(input1);
    container.appendChild(instruction2);
    container.appendChild(input2Group); // Inline input + button

    // Add the container to the body
    document.body.appendChild(container);

    // Focus the first input field
    input1.focus();

    // Handle form submission
    submitButton.addEventListener('click', () => saveInputs(container, x, y, input1.value.toUpperCase(), input2.value.toUpperCase()));

    // Handle submission via Enter key
    input2.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            saveInputs(container, x, y, input1.value.toUpperCase(), input2.value.toUpperCase());
        }
    });

    // handle changing note heights with the up and down arrows
    container.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp') {
            tone += 1
            if (tone > 11){
                tone = 0
                octave += 1
            }
            recomendation = `${toneNamesUp[tone]}${octave}`
            input1.value = recomendation
        }else if (event.key === 'ArrowDown') {
            tone -= 1
            if (tone < 0){
                tone = 11
                octave -= 1
            }
            recomendation = `${toneNamesDown[tone]}${octave}`
            input1.value = recomendation
        }
    });
}


function saveInputs(container, x, y, tone, duration) {
    const re1 = /^[A-G](#|B)*[0-9]$/;
    const re2 = /^((0|\d){1,2}((\.|,)\d)?(\.)*(-)?)?$/;

    // Validate and save the input values
    if (re1.test(tone.trim()) && re2.test(duration.trim())) {
        clickData.push({ x, y, tone, duration });
        console.log(clickData);
        updateClicksList(x, y);

        drawMarker(x, y);

        // Remove the form container
        container.remove();
        updateUi();
        
    } else {
        if (tone.trim() == "" || duration.trim() == "") {
            container.remove();
        }else{
            alert('Please enter valid values in the fields');
        }
    }
}

function displayTextboxRest(x, y) {
    const container = document.createElement('div');
    container.className = 'input-container';
    container.style.left = `${x + canvas.offsetLeft}px`;
    container.style.top = `${y + canvas.offsetTop}px`;
    container.style.position = 'absolute';
    container.style.border = '1px solid #000';
    container.style.backgroundColor = '#fff';
    container.style.padding = '10px';
    container.style.paddingTop = '0px';

    // Common class for consistent input styling
    const inputClass = "form-control text-start w-auto custom-input"; 

    const instruction1 = document.createElement('div');
    instruction1.textContent = 'Enter the rest duration (1, 4, 8, 16 etc):';
    instruction1.className = 'mt-2';

    // Wrapper for input and button (keeps them inline)
    const inputGroup = document.createElement('div');
    inputGroup.className = "d-flex gap-2 align-items-center mt-2"; // Inline layout

    const input1 = document.createElement('input');
    input1.type = 'text';
    input1.className = inputClass; // Consistent input style

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Ok';
    submitButton.className = 'btn btn-outline-secondary';

    // Append input and button inside the wrapper
    inputGroup.appendChild(input1);
    inputGroup.appendChild(submitButton);

    // Append elements to the container
    container.appendChild(instruction1);
    container.appendChild(inputGroup); // Inline input + button

    document.body.appendChild(container);

    input1.focus();

    submitButton.addEventListener('click', () => saveRestInputs(container, x, y, input1.value));

    input1.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            saveRestInputs(container, x, y, input1.value.toUpperCase());
        }
    });
}

function saveRestInputs(container, x, y, duration) {
    const re1 = /^((0|\d){1,2}((\.|,)\d)?(\.)*(-)?)?$/;

    if (re1.test(duration.trim())) {
        clickData.push({ x, y, duration });
        updateClicksList(x, y);

        container.remove();
        updateUi();
    } else {
        if (duration.trim() == "") {
            container.remove();
        }
        alert('Please enter valid values in the fields');
    }
}


//----------------- Functions for visuals -----------------
function draw_existing_staffs(){
    staffData.forEach(staff => {
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.rect(staff.initial_staff_click[0], staff.initial_staff_click[1], staff.final_staff_click[0] - staff.initial_staff_click[0], staff.final_staff_click[1] - staff.initial_staff_click[1]);
        ctx.stroke();
    });
}

function draw_staff_box(){
    // Draw a rectangle around the staff
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.rect(initial_staff_click[0], initial_staff_click[1], final_staff_click[0] - initial_staff_click[0], final_staff_click[1] - initial_staff_click[1]);
    ctx.stroke();

    //draw a dotted rectangle around the staff taking into account the vertical margin
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.rect(initial_staff_click[0], initial_staff_click[1] - staff.margin_vertical, final_staff_click[0] - initial_staff_click[0], final_staff_click[1] - initial_staff_click[1] + 2* staff.margin_vertical);
    
    ctx.stroke();
    ctx.setLineDash([]);
}


function drawMarker(x, y) {
    if (stage == 1) color = 'rgba(255, 0, 0, 0.5)';
    else if (stage == 2) color = 'rgba(255, 100, 0, 0.5)';
    else if (stage == 3) color = 'rgba(255, 0, 100, 0.5)';

    ctx.fillStyle = color
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
}

function updateClicksList(x, y) {
    const li = document.createElement('li');
    li.textContent = `Click at (${x.toFixed(2)}, ${y.toFixed(2)}) with label: ${clickData[clickData.length - 1].value1}, duration: ${clickData[clickData.length - 1].value2}`;
    clicksList.appendChild(li);
}

function updateButtons() {
    undoButton.disabled = clickData.length === 0;
    redoButton.disabled = undoneClicks.length === 0;
    nextButton.disabled = current_page === last_page;
    prevButton.disabled = current_page === first_page;
    done_button.disabled = staff === 0;
    clearButton.disabled = clickData.length === 0;

    undoButton.className = undoButton.disabled ? 'btn btn-outline-secondary' : 'btn btn-outline-primary';
    redoButton.className = redoButton.disabled ? 'btn btn-outline-secondary' : 'btn btn-outline-primary';
    clearButton.className = clearButton.disabled ? 'btn btn-outline-secondary' : 'btn btn-outline-primary';
    nextButton.className = nextButton.disabled ? 'btn btn-outline-secondary' : 'btn btn-outline-primary';
    prevButton.className = prevButton.disabled ? 'btn btn-outline-secondary' : 'btn btn-outline-primary';
    done_button.className = done_button.disabled ? 'btn btn-outline-secondary' : 'btn btn-outline-primary';
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
}

function clearTextFields(){
    const inputContainers = document.querySelectorAll('[class$="input-container"]');
    inputContainers.forEach(container => container.remove());

    if (stage == 0){
        staff = 0;
        initial_staff_click = [-1, -1];
        final_staff_click = [-1, -1];
    }
}


function handleProgressBar(){
    stat[stage].style.visibility = "visible";
    stat[stage].className = "progress-bar w-25 bg-info";
    for (let i = 0; i < stage; i++){
        stat[i].className = "progress-bar w-25 bg-success";
    }
    for (let i = stage + 1; i < 4; i++){
        stat[i].style.visibility = "hidden";
    }
}

function updateUi(){
    clearCanvas();
    updateButtons();
    draw_existing_staffs();
    draw_staff_box();
    clickData.forEach(click => {
        drawMarker(click.x, click.y);
    });

    handleProgressBar();
}