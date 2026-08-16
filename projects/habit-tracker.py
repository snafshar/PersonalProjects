from dataclasses import dataclass
@dataclass
class Habit: name:str; completed:int=0
class Tracker:
 def __init__(self):self.habits={}
 def add(self,name):self.habits[name]=Habit(name)
 def complete(self,name):self.habits[name].completed+=1
if __name__=='__main__':t=Tracker();t.add('study');t.complete('study');print(t.habits)