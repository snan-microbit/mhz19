/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="\u2601"
namespace CO2 {

    let _txPin: SerialPin = SerialPin.P0;
    let _rxPin: SerialPin = SerialPin.P1;
    let _pwmPin: DigitalPin = DigitalPin.P2;
    let _co2: number;
    let _range: number = 5000;
    let _inputBuffer = control.createBuffer(9);

    const _comandCalibration = control.createBuffer(9);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 0, 0xff);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 1, 0x01);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 2, 0x87);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 3, 0x00);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 4, 0x00);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 5, 0x00);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 6, 0x00);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 7, 0x00);
    _comandCalibration.setNumber(NumberFormat.Int8LE, 8, 0x78);

    const _comandCo2 = control.createBuffer(9);
    _comandCo2.setNumber(NumberFormat.Int8LE, 0, 0xff);
    _comandCo2.setNumber(NumberFormat.Int8LE, 1, 0x01);
    _comandCo2.setNumber(NumberFormat.Int8LE, 2, 0x86);
    _comandCo2.setNumber(NumberFormat.Int8LE, 3, 0x00);
    _comandCo2.setNumber(NumberFormat.Int8LE, 4, 0x00);
    _comandCo2.setNumber(NumberFormat.Int8LE, 5, 0x00);
    _comandCo2.setNumber(NumberFormat.Int8LE, 6, 0x00);
    _comandCo2.setNumber(NumberFormat.Int8LE, 7, 0x00);
    _comandCo2.setNumber(NumberFormat.Int8LE, 8, 0x79);


    //% blockId=iniciar_mhz19 block="Iniciar Sensor de CO2 con pines TX %pinTx|RX %pinRx|PWM %pinPwm"
    export function iniciarSensorMhz(pinTx: SerialPin, pinRx: SerialPin, pinPwm: DigitalPin) {
        _txPin = pinTx;
        _rxPin = pinRx;
        _pwmPin = pinPwm;
    }

    function esperarSubida() {
        while (pins.digitalReadPin(_pwmPin)) {
            control.waitMicros(1);
        }
        while (!(pins.digitalReadPin(_pwmPin))) {
            control.waitMicros(1);
        }
    }

    //% blockId=medirco2ppmuart block="Co2 PPM PWM"
    export function get_co2_pwm(): number {
        //Espera flanco de subida
        esperarSubida();
        //Calcula tiempo en alto
        let t_ini = input.runningTime();
        while (pins.digitalReadPin(_pwmPin)) {
            control.waitMicros(1);
        }
        let t_fin = input.runningTime();
        let t_high = t_fin - t_ini;
        //Calcula tiempo en bajo
        t_ini = input.runningTime();
        while (!(pins.digitalReadPin(_pwmPin))) {
            control.waitMicros(1);
        }
        t_fin = input.runningTime();
        let t_low = t_fin - t_ini;
        //Calcula consentracion de co2
        _co2 = 5000 * ((t_high - 2) / (t_high + (t_low - 4)));
        return Math.round(_co2);

    }

    export function calibrate_zero() {
        serial.redirect(_rxPin, _txPin, 9600);
        serial.writeBuffer(_comandCalibration);
        serial.redirectToUSB()
    }

    //% blockId=medir co2 ppm uart block="Co2 PPM UART"
    export function get_c02_uart() {
        serial.redirect(_rxPin, _txPin, 9600);
        serial.writeBuffer(_comandCo2);
        basic.pause(10);
        _inputBuffer = serial.readBuffer(9);
        _co2 = _inputBuffer.getNumber(NumberFormat.UInt8LE, 2) * 256 + _inputBuffer.getNumber(NumberFormat.UInt8LE, 3)
        serial.redirectToUSB()
        return _co2;
    }

}