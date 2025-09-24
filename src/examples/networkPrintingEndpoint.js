// Backend Network Printing Endpoint Example
// This is a Node.js/Express example for handling thermal printer network printing

const express = require('express');
const net = require('net');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Network printing endpoint
app.post('/api/print/network', async (req, res) => {
  try {
    const { commands, printerIP, port = 9100 } = req.body;

    if (!commands || !printerIP) {
      return res.status(400).json({
        error: 'Missing required parameters: commands and printerIP'
      });
    }

    // Convert command numbers back to buffer
    const commandBuffer = Buffer.from(commands);

    // Create TCP connection to thermal printer
    const client = new net.Socket();

    // Set connection timeout
    client.setTimeout(10000);

    const printPromise = new Promise((resolve, reject) => {
      client.connect(port, printerIP, () => {
        console.log(`Connected to printer at ${printerIP}:${port}`);

        // Send ESC/POS commands to printer
        client.write(commandBuffer, (error) => {
          if (error) {
            reject(error);
          } else {
            console.log('Commands sent successfully');
            resolve();
          }
        });
      });

      client.on('error', (error) => {
        console.error('Printer connection error:', error);
        reject(error);
      });

      client.on('timeout', () => {
        console.error('Printer connection timeout');
        reject(new Error('Connection timeout'));
      });

      client.on('close', () => {
        console.log('Printer connection closed');
      });
    });

    await printPromise;
    client.destroy();

    res.json({ success: true, message: 'Print job sent successfully' });

  } catch (error) {
    console.error('Network printing failed:', error);
    res.status(500).json({
      error: 'Print job failed',
      details: error.message
    });
  }
});

// USB printing endpoint (requires node-usb library)
app.post('/api/print/usb', async (req, res) => {
  try {
    const { commands, vendorId, productId } = req.body;

    // This requires the 'usb' npm package
    // npm install usb
    const usb = require('usb');

    if (!commands) {
      return res.status(400).json({
        error: 'Missing required parameter: commands'
      });
    }

    const commandBuffer = Buffer.from(commands);

    // Find USB printer device
    const device = usb.findByIds(vendorId, productId);
    if (!device) {
      return res.status(404).json({
        error: 'USB printer not found'
      });
    }

    device.open();
    const interface = device.interface(0);

    if (interface.isKernelDriverActive()) {
      interface.detachKernelDriver();
    }

    interface.claim();

    const endpoint = interface.endpoints.find(e => e.direction === 'out');
    if (!endpoint) {
      return res.status(500).json({
        error: 'No output endpoint found'
      });
    }

    // Send commands to USB printer
    endpoint.transfer(commandBuffer, (error) => {
      interface.release();
      device.close();

      if (error) {
        return res.status(500).json({
          error: 'USB print failed',
          details: error.message
        });
      }

      res.json({ success: true, message: 'USB print job sent successfully' });
    });

  } catch (error) {
    console.error('USB printing failed:', error);
    res.status(500).json({
      error: 'USB print job failed',
      details: error.message
    });
  }
});

// Serial port printing endpoint (requires serialport library)
app.post('/api/print/serial', async (req, res) => {
  try {
    const { commands, portPath, baudRate = 9600 } = req.body;

    // This requires the 'serialport' npm package
    // npm install serialport
    const { SerialPort } = require('serialport');

    if (!commands || !portPath) {
      return res.status(400).json({
        error: 'Missing required parameters: commands and portPath'
      });
    }

    const commandBuffer = Buffer.from(commands);

    const port = new SerialPort({
      path: portPath,
      baudRate: baudRate,
      autoOpen: false
    });

    const printPromise = new Promise((resolve, reject) => {
      port.open((error) => {
        if (error) {
          reject(error);
          return;
        }

        port.write(commandBuffer, (writeError) => {
          if (writeError) {
            reject(writeError);
          } else {
            port.close((closeError) => {
              if (closeError) {
                console.warn('Error closing serial port:', closeError);
              }
              resolve();
            });
          }
        });
      });
    });

    await printPromise;
    res.json({ success: true, message: 'Serial print job sent successfully' });

  } catch (error) {
    console.error('Serial printing failed:', error);
    res.status(500).json({
      error: 'Serial print job failed',
      details: error.message
    });
  }
});

// Get available printers endpoint
app.get('/api/printers', async (req, res) => {
  try {
    const printers = [];

    // Network printers (you would typically store these in a database)
    const networkPrinters = [
      { id: 'network1', name: 'Kitchen Printer', ip: '192.168.1.100', port: 9100, type: 'network' },
      { id: 'network2', name: 'Receipt Printer', ip: '192.168.1.101', port: 9100, type: 'network' },
    ];
    printers.push(...networkPrinters);

    // USB printers
    try {
      const usb = require('usb');
      const devices = usb.getDeviceList();
      const usbPrinters = devices
        .filter(device => {
          // Filter for common thermal printer vendor IDs
          const thermalPrinterVendors = [0x04b8, 0x0483, 0x20d1]; // Epson, STM, etc.
          return thermalPrinterVendors.includes(device.deviceDescriptor.idVendor);
        })
        .map((device, index) => ({
          id: `usb${index}`,
          name: `USB Printer ${index + 1}`,
          vendorId: device.deviceDescriptor.idVendor,
          productId: device.deviceDescriptor.idProduct,
          type: 'usb'
        }));
      printers.push(...usbPrinters);
    } catch (error) {
      console.log('USB library not available');
    }

    // Serial port printers
    try {
      const { SerialPort } = require('serialport');
      const ports = await SerialPort.list();
      const serialPrinters = ports.map((port, index) => ({
        id: `serial${index}`,
        name: `Serial Printer (${port.path})`,
        path: port.path,
        type: 'serial'
      }));
      printers.push(...serialPrinters);
    } catch (error) {
      console.log('SerialPort library not available');
    }

    res.json({ printers });
  } catch (error) {
    console.error('Error getting printers:', error);
    res.status(500).json({
      error: 'Failed to get printers',
      details: error.message
    });
  }
});

// Test printer connection endpoint
app.post('/api/printers/test', async (req, res) => {
  try {
    const { type, ...config } = req.body;

    switch (type) {
      case 'network':
        const { ip, port = 9100 } = config;
        const client = new net.Socket();
        client.setTimeout(5000);

        const testPromise = new Promise((resolve, reject) => {
          client.connect(port, ip, () => {
            client.destroy();
            resolve();
          });

          client.on('error', reject);
          client.on('timeout', () => reject(new Error('Connection timeout')));
        });

        await testPromise;
        break;

      case 'usb':
        const { vendorId, productId } = config;
        const usb = require('usb');
        const device = usb.findByIds(vendorId, productId);
        if (!device) {
          throw new Error('USB device not found');
        }
        break;

      case 'serial':
        const { path: portPath, baudRate = 9600 } = config;
        const { SerialPort } = require('serialport');
        const port = new SerialPort({
          path: portPath,
          baudRate,
          autoOpen: false
        });

        const serialTestPromise = new Promise((resolve, reject) => {
          port.open((error) => {
            if (error) {
              reject(error);
            } else {
              port.close();
              resolve();
            }
          });
        });

        await serialTestPromise;
        break;

      default:
        throw new Error('Invalid printer type');
    }

    res.json({ success: true, message: 'Printer connection test successful' });
  } catch (error) {
    console.error('Printer test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Thermal printer server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /api/print/network - Network printer');
  console.log('  POST /api/print/usb - USB printer');
  console.log('  POST /api/print/serial - Serial printer');
  console.log('  GET /api/printers - List available printers');
  console.log('  POST /api/printers/test - Test printer connection');
});

module.exports = app;
