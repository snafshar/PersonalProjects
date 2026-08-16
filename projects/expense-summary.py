from collections import defaultdict
def summarize(rows):
 totals=defaultdict(float)
 for category,amount in rows:totals[category]+=amount
 return dict(sorted(totals.items()))
if __name__=='__main__':print(summarize([('food',12.5),('books',20),('food',4.5)]))