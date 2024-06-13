import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading ] = useState(false)
  const [isPaginate, setPaginate] = useState(true)
  const [viewMore, setviewMore] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    setPaginate(true)
    // transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()  
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      // paginatedTransactionsUtils.invalidateData()
      // // bug 3: added condition
      // if(employeeId){
      //   await transactionsByEmployeeUtils.fetchById(employeeId)
      // }
      // else{
      //   await loadAllTransactions()
      // } 
      setPaginate(false)   
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
    if (paginatedTransactions?.nextPage === null) {
      setviewMore(false)
    } else {
      setviewMore(true)
    }
  }, [employeeUtils.loading, employees, loadAllTransactions, paginatedTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            if (newValue.id === ""){
              await loadAllTransactions()
              return
            }
            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

          
        <div className="RampGrid">
          <Transactions transactions={transactions} />
          
          {isPaginate && transactions !== null && viewMore && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
