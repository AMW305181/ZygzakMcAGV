"""remote_agv controller."""

# You may need to import some classes of the controller module. Ex:
#  from controller import Robot, Motor, DistanceSensor
from controller import Robot
from controller import Motor
import websockets
import asyncio
import threading
# create the Robot instance.
class WebotsClient:
    def __init__(self):
        self.robot = Robot()
        self.timestep = int(self.robot.getBasicTimeStep())
        self.websocket = None
        self.server_url = "ws://localhost:8080" 
        self.wheels = []
        self.wheelsNames = ['wheel1', 'wheel2', 'wheel3', 'wheel4'] #left - 1, 3; right - 2, 4
        for i in range(4):
            self.wheels.append(self.robot.getDevice(self.wheelsNames[i]))
            self.wheels[i].setPosition(float('inf'))
            self.wheels[i].setVelocity(0.0)
        self.ds = []
        self.dsNames = ['ds_right', 'ds_left']
        for i in range(2):
            self.ds.append(self.robot.getDevice(self.dsNames[i]))
            self.ds[i].enable(self.timestep)
        self.leftSpeed=0.0
        self.rightSpeed=0.0
        
    async def connect_to_server(self):
        try:
            self.websocket = await websockets.connect(self.server_url)
            print("Connected to server!")
            
            while self.robot.step(self.timestep) != -1:
                # Send robot status to server
                #status = self.get_robot_status()
                #await self.websocket.send(status)
                
                # Check for incoming commands
                try:
                    command = await asyncio.wait_for(self.websocket.recv(), timeout=0.01)
                    self.process_command(command)
                except asyncio.TimeoutError:
                    pass
                    
        except Exception as e:
            print(f"Connection error: {e}")
        #finally:
            #if self.websocket:
             #   await self.websocket.close()

# get the time step of the current world.

#motors and sensors init

    def process_command(self, command):
        """Execute commands from server"""
        if command=='FWD': #STC
                self.leftSpeed=1.0
                self.rightSpeed=1.0
                    
            #left
        elif command=='LEFT':
                self.leftSpeed=-1.0
                self.rightSpeed=1.0                
            #right
        elif command=='RIGHT':
                self.leftSpeed=1.0
                self.rightSpeed=-1.0
            #back
        elif command=='BACK':               
                self.leftSpeed=-1.0
                self.rightSpeed=-1.0
        elif command=='STOP':
                self.leftSpeed=0.0
                self.rightSpeed=0.0
        self.wheels[0].setVelocity(self.leftSpeed)
        self.wheels[1].setVelocity(self.rightSpeed)
        self.wheels[2].setVelocity(self.leftSpeed)
        self.wheels[3].setVelocity(self.rightSpeed)
        print(f"Executing command: {command}")
        # Implement your command processing

    def run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.connect_to_server())
        
if __name__ == "__main__":
    client = WebotsClient()
    client.run()

#start_server = websockets.serve(handle_connection, "localhost", 5173)
#asyncio.get_event_loop().run_until_complete(start_server)
#asyncio.get_event_loop().run_forever()
