    $(document).ready(function() {

    // Runs when formOne's 'Calculate' button is clicked
    $('#formOneCalc').click(function() {
        // Grabs input values on click from formOne
        var $tWattsOne = $('#tWattsOne').val();
        var $hoursOnOne = $('#hoursOnOne').val();
        var $energyCostOne = $('#energyCostOne').val();

        // Calculates the day subtotal
        var $daySubSubTotal = $tWattsOne * $hoursOnOne * $energyCostOne;
        var $daySubTotal = $daySubSubTotal / 1000 || 0;
        //Rounds the answer to 2 decimal places
        var $dayTotal = $daySubTotal.toFixed(2);
        //Updates the daily savings field for formOne
        $('.formOne .displayDay').text($dayTotal);

        // Calculates the year subtotal
        var $yearSubTotal = $daySubTotal * 365 || 0;
        //Rounds the answer to 2 decimal places
        var $yearTotal = $yearSubTotal.toFixed(2);
        //Updates the yearly savings field for formOne
        $('.formOne .displayYear').text($yearTotal);

        //Calculates the month subTotal
        var $monthSubTotal = $yearSubTotal / 12 || 0;
        //Rounds the answer to 2 decimal places
        var $monthTotal = $monthSubTotal.toFixed(2);
        //Updates the monthly savings field for formOne
        $('.formOne .displayMonth').text($monthTotal);
    });
    // Clears formOne and its output fields
    $('#formOneClear').click(function() {
        //Clears out the form inputs
        $('#tWattsOne').val('');
        $('#hoursOnOne').val('');
        $('#energyCostOne').val('');
        //Clears out the ongoing savings fields
        $('.formOne .displayDay').text('0');
        $('.formOne .displayMonth').text('0');
        $('.formOne .displayYear').text('0');
    });
    // Runs when formTwo's 'Calculate' button is clicked
    $('#formTwoCalc').click(function() {

        // Grabs input values on click from formTwo
        var $totalWattsExisting = $('#totalWattsExisting').val();
        var $hoursOnExisting = $('#hoursOnExisting').val();
        var $energyCostExisting = $('#energyCostExisting').val();
        var $totalWattsNew = $('#totalWattsNew').val();
        var $hoursOnNew = $('#hoursOnNew').val();
        var $energyCostNew = $('#energyCostNew').val();

        // Existing system
        var $daySubSubTotal = $totalWattsExisting * $hoursOnExisting * $energyCostExisting;
        var $daySubTotal = $daySubSubTotal / 1000 || 0;
        var $dayTotalOld = $daySubTotal.toFixed(2);
        $('.existingSystem .displayDay').text($dayTotalOld);
        $('.existingSystem .displayDay').val($dayTotalOld);
        var $yearSubTotal = $daySubTotal * 365 || 0;
        var $yearTotalOld = $yearSubTotal.toFixed(2);
        $('.existingSystem .displayYear').text($yearTotalOld);
        $('.existingSystem .displayYear').val($yearTotalOld);
        var $monthSubTotal = $yearSubTotal / 12 || 0;
        var $monthTotalOld = $monthSubTotal.toFixed(2);
        $('.existingSystem .displayMonth').text($monthTotalOld);
        $('.existingSystem .displayMonth').val($monthTotalOld);

        // LED System
        var $daySubSubTotalNew = $totalWattsNew * $hoursOnNew * $energyCostNew;
        var $daySubTotalNew = $daySubSubTotalNew / 1000 || 0;
        var $dayTotalNew = $daySubTotalNew.toFixed(2);
        $('.ledSystem .displayDay').text($dayTotalNew);
        $('.ledSystem .displayDay').val($dayTotalNew);
        var $yearSubTotalNew = $daySubTotalNew * 365 || 0;
        var $yearTotalNew = $yearSubTotalNew.toFixed(2);
        $('.ledSystem .displayYear').text($yearTotalNew);
        $('.ledSystem .displayYear').val($yearTotalNew);
        var $monthSubTotalNew = $yearSubTotalNew / 12 || 0;
        var $monthTotalNew = $monthSubTotalNew.toFixed(2);
        $('.ledSystem .displayMonth').text($monthTotalNew);
        $('.ledSystem .displayMonth').val($monthTotalNew);

        // Ongoing Savings
        var $oldDay = $('.existingSystem .displayDay').val();
        var $newDay = $('.ledSystem .displayDay').val();
        var $oldMonth = $('.existingSystem .displayMonth').val();
        var $newMonth = $('.ledSystem .displayMonth').val();
        var $oldYear = $('.existingSystem .displayYear').val();
        var $newYear = $('.ledSystem .displayYear').val();

        var $daySavings = $oldDay - $newDay;
        $('.totalSavings .displayDay').text($daySavings.toFixed(2));
        var $monthSavings = $oldMonth - $newMonth;
        $('.totalSavings .displayMonth').text($monthSavings.toFixed(2));
        var $yearSavings = $oldYear - $newYear;
        $('.totalSavings .displayYear').text($yearSavings.toFixed(2));

    });
    // Clears formTwo
    $('#formTwoClear').click(function() {
        //Clears out the form Inputs
        $('#totalWattsExisting').val('');
        $('#hoursOnExisting').val('');
        $('#energyCostExisting').val('');
        $('#totalWattsNew').val('');
        $('#hoursOnNew').val('');
        $('#energyCostNew').val('');
        //Clears out the display fields
        $('.existingSystem .displayDay').text('0');
        $('.existingSystem .displayMonth').text('0');
        $('.existingSystem .displayYear').text('0');
        $('.ledSystem .displayDay').text('0');
        $('.ledSystem .displayMonth').text('0');
        $('.ledSystem .displayYear').text('0');
        $('.totalSavings .displayDay').text('0');
        $('.totalSavings .displayMonth').text('0');
        $('.totalSavings .displayYear').text('0');
    });

    // Runs when formThree's 'Calculate' button is clicked
    $('#formThreeCalc').click(function() {

        // Grabs input values on click from formThree
        var $totalWattsExisting = $('#totalWattsExistingTwo').val();
        var $hoursOnExisting = $('#hoursOnExistingTwo').val();
        var $energyCostExisting = $('#energyCostExistingTwo').val();
        var $totalWattsNew = $('#totalWattsNewTwo').val();
        var $hoursOnNew = $('#hoursOnNewTwo').val();
        var $energyCostNew = $('#energyCostNewTwo').val();
        var $existingNumBulbs = $('#existingNumBulbs').val();
        var $costPerHalo = $('#costPerHalo').val();
        var $costPerLed = $('#costPerLed').val();

        //Bulb Maintenance
        var $existingMaintenanceCost = $existingNumBulbs * $costPerHalo / 18;
        var $ledBulbOverhead = $existingNumBulbs * $costPerLed;

        // Existing system
        var $daySubSubTotal = $totalWattsExisting * $hoursOnExisting * $energyCostExisting + $existingMaintenanceCost * 12;
        var $daySubTotal = $daySubSubTotal / 1000 || 0;
        var $dayTotalOld = $daySubTotal.toFixed(2);
        $('.existingSystem .displayDay').text($dayTotalOld);
        $('.existingSystem .displayDay').val($dayTotalOld);
        var $yearSubTotal = $daySubTotal * 365 + $existingMaintenanceCost * 12 || 0;
        var $yearTotalOld = $yearSubTotal.toFixed(2);
        $('.existingSystem .displayYear').text($yearTotalOld);
        $('.existingSystem .displayYear').val($yearTotalOld);
        var $monthSubTotal = $yearSubTotal / 12 + $existingMaintenanceCost || 0;
        var $monthTotalOld = $monthSubTotal.toFixed(2);
        $('.existingSystem .displayMonth').text($monthTotalOld);
        $('.existingSystem .displayMonth').val($monthTotalOld);

        // LED System
        var $daySubSubTotalNew = $totalWattsNew * $hoursOnNew * $energyCostNew;
        var $daySubTotalNew = $daySubSubTotalNew / 1000 || 0;
        var $dayTotalNew = $daySubTotalNew.toFixed(2);
        $('.ledSystem .displayDay').text($dayTotalNew);
        $('.ledSystem .displayDay').val($dayTotalNew);
        var $yearSubTotalNew = $daySubTotalNew * 365 || 0;
        var $yearTotalNew = $yearSubTotalNew.toFixed(2);
        $('.ledSystem .displayYear').text($yearTotalNew);
        $('.ledSystem .displayYear').val($yearTotalNew);
        var $monthSubTotalNew = $yearSubTotalNew / 12 || 0;
        var $monthTotalNew = $monthSubTotalNew.toFixed(2);
        $('.ledSystem .displayMonth').text($monthTotalNew);
        $('.ledSystem .displayMonth').val($monthTotalNew);
        $('#ledBulbInvestment').text($ledBulbOverhead.toFixed(2));
        $('#ledBulbInvestment').val($ledBulbOverhead.toFixed(2));
 
        // Ongoing Savings 
        var $oldDay = $('.existingSystem .displayDay').val();
        var $newDay = $('.ledSystem .displayDay').val();
        var $oldMonth = $('.existingSystem .displayMonth').val();
        var $newMonth = $('.ledSystem .displayMonth').val();
        var $oldYear = $('.existingSystem .displayYear').val();
        var $newYear = $('.ledSystem .displayYear').val();

        var $daySavings = $oldDay - $newDay;
        $('.totalSavings .displayDay').text($daySavings.toFixed(2));
        var $monthSavings = $oldMonth - $newMonth;
        $('.totalSavings .displayMonth').text($monthSavings.toFixed(2));
        var $yearSavings = $oldYear - $newYear;
        $('.totalSavings .displayYear').text($yearSavings.toFixed(2));

        // Payback Period
        var $paybackPeriod = $monthSavings * 12 / $ledBulbOverhead;
        $('#paybackPeriod').text($paybackPeriod.toFixed(1));

    });

    // Clears formThree
    $('#formThreeClear').click(function() {

        //Clears out the form Inputs
        $('#totalWattsExistingTwo').val('');
        $('#hoursOnExistingTwo').val('');
        $('#energyCostExistingTwo').val('');
        $('#totalWattsNewTwo').val('');
        $('#hoursOnNewTwo').val('');
        $('#energyCostNewTwo').val('');
        $('#existingNumBulbs').val('');
        $('#costPerHalo').val('');
        $('#costPerLed').val('');

        //Clears out the display fields
        $('.existingSystem .displayDay').text('0');
        $('.existingSystem .displayMonth').text('0');
        $('.existingSystem .displayYear').text('0');
        $('.ledSystem .displayDay').text('0');
        $('.ledSystem .displayMonth').text('0');
        $('.ledSystem .displayYear').text('0');
        $('.totalSavings .displayDay').text('0');
        $('.totalSavings .displayMonth').text('0');
        $('.totalSavings .displayYear').text('0');
        $('#paybackPeriod').text('0');
        $('#ledBulbInvestment').text('0');

    });
});